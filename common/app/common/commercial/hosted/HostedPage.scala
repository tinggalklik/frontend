package common.commercial.hosted

import java.awt.Color

import model.StandalonePage

trait HostedPage extends StandalonePage {
  def campaign: HostedCampaign
  def pageUrl: String
  def pageName: String
  def title: String
  def imageUrl: String
  def pageTitle: String
  def standfirst: String

  def facebookShareText: Option[String]
  def twitterShareText: Option[String]
  def emailSubjectText: Option[String]

  def twitterText = twitterShareText.getOrElse(if(standfirst.length < 136) standfirst else title) + " #ad"
  def facebookText = facebookShareText.getOrElse(standfirst)
  def emailText = emailSubjectText.getOrElse(title) + " - Advertiser Content hosted by the Guardian"

  final val toneId = "tone/hosted"
  final val toneName = "Hosted"

  val brandColourCssClass = s"hosted-tone--${campaign.cssClass} hosted-tone"
  val brandBackgroundCssClass = s"hosted-tone-bg--${campaign.cssClass} hosted-tone-bg"
  val brandBorderCssClass = s"hosted-tone-border--${campaign.cssClass} hosted-tone-border"
  val brandBtnCssClass = s"hosted-tone-btn--${campaign.cssClass} hosted-tone-btn"
}

case class HostedCampaign(
  id: String,
  name: String,
  owner: String,
  logo: HostedLogo,
  cssClass: String,
  fontColour: FontColour,
  logoLink: Option[String] = None
)

case class FontColour(brandColour: String) {

  lazy val shouldHaveBrightFont = !isBrandColourBright

  private val isBrandColourBright = {
    val hexColour = brandColour.stripPrefix("#")
    val rgb = Integer.parseInt(hexColour, 16)
    val c = new Color(rgb)
    val hsl = rgbToHsl(c.getRed, c.getGreen, c.getBlue)
    val brightness = hsl._3
    println(hsl)
    brightness > 0.5
  }

  /**
   * Converts an RGB color value to HSL. Conversion formula
   * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
   * Assumes r, g, and b are contained in the set [0, 255] and
   * returns h, s, and l in the set [0, 1].
   *
   * Taken from http://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion
   */
  private def rgbToHsl(red:Int, green:Int, blue:Int): (Int, Int, Int) = {
    println(red, green, blue)
    val r = red / 255
    val g = green / 255
    val b = blue / 255
    println(r, g, b)
    val max = Math.max(Math.max(r, g), b)
    val min = Math.min(Math.min(r, g), b)
    var h = (max + min) / 2
    var s = (max + min) / 2
    val l = (max + min) / 2

    if(max == min) {
      h = 0 // achromatic
      s = 0
    } else {
      val d = max - min
      s = if(l > 0.5) {d / (2 - max - min)} else {d / (max + min)}
      max match {
        case `r` =>
          h = (g - b) / d + (if(g < b) 6 else 0)
        case `g` =>
          h = (b - r) / d + 2
        case `b` =>
          h = (r - g) / d + 4
      }
      h /= 6
    }

    (h, s, l)
  }
}

case class HostedLogo(
  url: String
)
