package dfp

import common.dfp._
import common.{ExecutionContexts, Logging}
import conf.switches.Switches.DfpCachingSwitch
import org.joda.time.DateTime
import play.api.libs.json.Json
import play.api.libs.json.Json.{toJson, _}
import tools.Store

import scala.concurrent.Future

object DfpDataCacheJob extends ExecutionContexts with Logging {

  case class LineItemLoadSummary(prevCount: Int,
                                 loadThreshold: Option[DateTime],
                                 current: Seq[GuLineItem],
                                 recentlyAddedIds: Seq[Long],
                                 recentlyModifiedIds: Seq[Long],
                                 recentlyRemovedIds: Seq[Long])

  def run(): Future[Unit] = Future {
    if (DfpCachingSwitch.isSwitchedOn) {
      log.info("Refreshing data cache")
      val start = System.currentTimeMillis
      val data = loadLineItems()
      val duration = System.currentTimeMillis - start
      log.info(s"Loading DFP data took $duration ms")
      write(data)
    }
    else log.info("DFP caching switched off")
  }

  /*
  for initialization and total refresh of data,
  so would be used for first read and for emergency data update.
  */
  def refreshAllDfpData(): Unit = {
    for {
      _ <- AdUnitAgent.refresh()
      _ <- CustomFieldAgent.refresh()
      _ <- CustomTargetingKeyAgent.refresh()
      _ <- CustomTargetingValueAgent.refresh()
      _ <- PlacementAgent.refresh()
    } {
      loadLineItems()
    }
  }

  private def loadLineItems(): DfpDataExtractor = {

    def fetchCachedLineItems(): Seq[GuLineItem] = {
      val maybeLineItems = for {
        json <- Store.getDfpLineItemsReport()
        lineItemReport <- Json.parse(json).asOpt[LineItemReport]
      } yield lineItemReport.lineItems
      maybeLineItems getOrElse Nil
    }

    val start = System.currentTimeMillis

    def logReport(loadSummary: LineItemLoadSummary): Unit = {
      def report(ids: Iterable[Long]): String = if (ids.isEmpty) "None" else ids.mkString(", ")
      log.info(s"Cached line item count was ${loadSummary.prevCount}")
      for (threshold <- loadSummary.loadThreshold) {
        log.info(s"Last modified time of cached line items: $threshold")
      }
      log.info(s"Added: ${report(loadSummary.recentlyAddedIds)}")
      log.info(s"Modified: ${report(loadSummary.recentlyModifiedIds)}")
      log.info(s"Removed: ${report(loadSummary.recentlyRemovedIds)}")
      log.info(s"Cached line item count now ${loadSummary.current.size}")
    }

    val lineItems: Seq[GuLineItem] = {

      val loadSummary: LineItemLoadSummary = loadLineItems(
        fetchCachedLineItems(),
        DfpApi.readLineItemsModifiedSince,
        DfpApi.readCurrentLineItems()
      )

      logReport(loadSummary)
      loadSummary.current
    }

    val loadDuration = System.currentTimeMillis - start
    log.info(s"Loading line items took $loadDuration ms")

    DfpDataExtractor(lineItems)
  }

  def loadLineItems(cachedLineItems: => Seq[GuLineItem],
                    lineItemsModifiedSince: DateTime => Seq[GuLineItem],
                    allReadyOrDeliveringLineItems: => Seq[GuLineItem]): LineItemLoadSummary = {

    def summarizeNewCache: LineItemLoadSummary = LineItemLoadSummary(
      prevCount = 0,
      loadThreshold = None,
      current = allReadyOrDeliveringLineItems,
      recentlyAddedIds = allReadyOrDeliveringLineItems.map(_.id),
      recentlyModifiedIds = Nil,
      recentlyRemovedIds = Nil
    )

    def summarizeUpdatedCache: LineItemLoadSummary = {

      val threshold = cachedLineItems.map(_.lastModified).maxBy(_.getMillis)
      val recentlyModified = lineItemsModifiedSince(threshold)

      def summarizeUnmodifiedCache: LineItemLoadSummary = LineItemLoadSummary(
          prevCount = cachedLineItems.size,
          loadThreshold = Some(threshold),
          current = cachedLineItems,
          recentlyAddedIds = Nil,
          recentlyModifiedIds = Nil,
          recentlyRemovedIds = Nil
        )

      def summarizeModifiedCache: LineItemLoadSummary = {

        val modifiedActives = recentlyModified filter (_.isActive)

        val added: Seq[GuLineItem] = modifiedActives filterNot (_ in cachedLineItems)
        val removed: Seq[GuLineItem] = cachedLineItems filterNot (_ in modifiedActives)
        val modified: Seq[GuLineItem] = cachedLineItems filter (_ in modifiedActives)
        val unmodified: Seq[GuLineItem] = cachedLineItems filterNot (cached => (cached in modified) || (cached in removed))

        val all: Seq[GuLineItem] = added ++ modified ++ unmodified

        LineItemLoadSummary(
          prevCount = cachedLineItems.size,
          loadThreshold = Some(threshold),
          current = all.sortBy(_.id),
          recentlyAddedIds = added map (_.id),
          recentlyModifiedIds = modified map (_.id),
          recentlyRemovedIds = removed map (_.id)
        )
      }

      if (recentlyModified.isEmpty) {
        summarizeUnmodifiedCache
      } else {
        summarizeModifiedCache
      }
    }

    if (cachedLineItems.isEmpty) {
      summarizeNewCache
    } else {
      summarizeUpdatedCache
    }
  }

  private def write(data: DfpDataExtractor): Unit = {

    if (data.isValid) {
      val now = printLondonTime(DateTime.now())

      val inlineMerchandisingTargetedTags = data.inlineMerchandisingTargetedTags
      Store.putInlineMerchandisingSponsorships(stringify(toJson(
        InlineMerchandisingTargetedTagsReport(now, inlineMerchandisingTargetedTags))))

      val targetedHighMerchandisingLineItems = data.targetedHighMerchandisingLineItems
      Store.putHighMerchandisingSponsorships(stringify(toJson(
        HighMerchandisingTargetedTagsReport(now, targetedHighMerchandisingLineItems))))

      val pageSkinSponsorships = data.pageSkinSponsorships
      Store.putDfpPageSkinAdUnits(stringify(toJson(PageSkinSponsorshipReport(now,
        pageSkinSponsorships))))

      Store.putDfpLineItemsReport(stringify(toJson(LineItemReport(now, data.lineItems))))

      Store.putTopAboveNavSlotTakeovers(stringify(toJson(LineItemReport(now,
        data.topAboveNavSlotTakeovers))))
    }
  }
}
