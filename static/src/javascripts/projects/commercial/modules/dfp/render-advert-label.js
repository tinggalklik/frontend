define([
    'Promise',
    'common/utils/fastdom-promise',
    'common/utils/config',
    'common/utils/storage'
], function (
    Promise,
    fastdom,
    config,
    store
) {
    function renderAdvertLabel(adSlotNode) {
        if (shouldRenderLabel(adSlotNode)) {
            var zIndexOverlay = 1050;
            var labelInner = '';
            if (config.switches.abHideAdsDev) {
                try {
                    var abParticipant = store.local.get('gu.ab.participations')['HideAdsDev'];
                    if (abParticipant && abParticipant.variant === 'variant') {
                        var payOpts = [
                            ['cc', 'credit card'],
                            ['pp', 'PayPal']
                        ].map(function(_) {
                            return '<li class="popup__item"><button class="hide-ads-menu-popup__button hide-ads-menu-popup__button-' + _[0] + '" from-slot="' + adSlotNode.id + '">Pay with ' + (_[1] || _[0].replace(/^[a-z]/, function($1) { return $1.toUpperCase(); })) + '</button></li>';
                        }).join('');
                        var hideAdsMenu = '<div class="hide-ads-menu popup popup--default popup__group is-off ' + adSlotNode.id + '__popup--hide-ads" id="hide-ads-menu__' + adSlotNode.id + '" style="z-index: ' + zIndexOverlay + ';"><h3 class="hide-ads popup__group-header"><p>Hiding our ads is simple. Just select one of the following payment methods</p></h3><ul>' + payOpts + '</ul></div>';
                        labelInner = ' <a class="hide-ads popup__toggle" data-toggle="' + adSlotNode.id + '__popup--hide-ads" aria-haspopup="true" aria-controls="hide-ads-menu__' + adSlotNode.id + '">hide ads</a>' + hideAdsMenu;
                    }
                    if (labelInner.length > 0) {
                        adSlotNode.style.zIndex = zIndexOverlay;
                    }
                } catch (x) {
                    // if we can't pull the ad hiding participation state, we'll treat it as excluded
                }
            }
            var labelDiv = '<div class="ad-slot__label" data-test-id="ad-slot-label" style="z-index: 2010;">Advertisement' + labelInner + '</div>';
            return fastdom.write(function () {
                adSlotNode.insertAdjacentHTML('afterbegin', labelDiv);
            });
        } else {
            return Promise.resolve(null);
        }
    }

    function shouldRenderLabel(adSlotNode) {
        return !(
            adSlotNode.classList.contains('ad-slot--fluid') ||
            adSlotNode.classList.contains('ad-slot--frame') ||
            adSlotNode.classList.contains('gu-style') ||
            adSlotNode.classList.contains('ad-slot--facebook') ||
            adSlotNode.getAttribute('data-label') === 'false' ||
            adSlotNode.getElementsByClassName('ad-slot__label').length
        );
    }

    return renderAdvertLabel;
});
