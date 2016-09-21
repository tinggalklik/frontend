define([
    'bonzo',
    'qwery',
    'fastdom',
    'common/utils/fetch',
    'common/utils/config',
    'common/utils/detect',
    'common/utils/sha1'
], function (
    bonzo,
    qwery,
    fastdom,
    fetch,
    config,
    detect,
    sha1
) {

    return function recordUserAdFeedback(pagePath, adSlotId, slotRenderEvent, feedbackType) {
        var feedbackUrl = 'https://j2cy9stt59.execute-api.eu-west-1.amazonaws.com/prod/adFeedback',
            adSlotEl = bonzo(qwery('#' + adSlotId))[0],
            stage = config.page.isProd ? 'PROD' : 'CODE',
            ua = detect.getUserAgent,
            adCreativeId = slotRenderEvent.creativeId.toString(),
            adLineId = slotRenderEvent.lineItemId.toString(),
            browser = ua.browser.toString() + ua.version.toString(),
            userAgent = window.navigator.userAgent,
            breakPoint = detect.getBreakpoint(),
            adSlotIframes = adSlotEl.getElementsByTagName('iframe'),
            adContentHtml = [];

        for (x = 0; x < adSlotIframes.length; x++) {
            try {
                adContentHtml.push(adSlotIframes[x].contentDocument.documentElement.innerHTML);
            } catch (ex) {
                console.log('error ' + ex.message);
            }
        }

        var adSlotHtml = encodeURIComponent(adContentHtml.join('')),
            keyHash = sha1.hash(stage+pagePath+adSlotId+adCreativeId+adLineId+feedbackType+browser+userAgent+breakPoint+adSlotHtml);

        var data = JSON.stringify({
            key: keyHash,
            stage: stage,
            adPage: pagePath,
            adSlotId: adSlotId,
            adCreativeId: adCreativeId,
            adLineId: adLineId,
            adFeedback: feedbackType,
            browser: browser,
            userAgent: userAgent,
            breakPoint: breakPoint,
            adSlotHtml: adSlotHtml
        });

        return fetch(feedbackUrl, {
            method: 'post',
            body: data,
            mode: 'cors'
        }).then(
            function () { return onComplete(adSlotId, feedbackType); },
            function () { return onComplete(adSlotId, feedbackType); }
        );
    };

    function onComplete(adSlotId, feedbackType) {    // we're complete - update the UI
        if (feedbackType !== 'ad-feedback-menu-opened') {
            fastdom.write(function() {
                bonzo(qwery('#' + adSlotId + '>.ad-slot__label')).text('Advertisement (Thanks for your feedback)');
            });
        }
    }

});
