define([
    'bean',
    'qwery',
    'common/utils/$',
    'common/utils/template',
    'common/views/svg',
    'common/utils/fastdom-promise',
    'common/utils/mediator',
    'text!common/views/contributions-embed.html',
    'common/utils/robust',
    'inlineSvg!svgs/icon/arrow-right',
    'common/utils/config',
    'common/modules/experiments/embed',
    'common/utils/ajax'

], function (bean,
             qwery,
             $,
             template,
             svg,
             fastdom,
             mediator,
             contributionsEmbed,
             robust,
             arrowRight,
             config,
             embed,
             ajax
) {


    return function () {

        this.id = 'ContributionsUsaDonatom';
        this.start = '2016-09-23';
        this.expiry = '2016-10-27';
        this.author = 'Jonathan Rankin';
        this.description = 'Test whether contributions embed performs better inline and in-article than at the bottom of the article.';
        this.showForSensitive = false;
        this.audience = 0.60;
        this.audienceOffset = 0.10;
        this.successMeasure = 'Impressions to number of contributions';
        this.audienceCriteria = 'All users';
        this.dataLinkNames = '';
        this.idealOutcome = 'The embed performs 20% better inline and in-article than it does at the bottom of the article';
        this.canRun = function () {
            var pageObj = config.page;
            return !(pageObj.isSensitive || pageObj.isLiveBlog || pageObj.isFront || obWidgetIsShown() || pageObj.isAdvertisementFeature);
        };

        function obWidgetIsShown() {
            var $outbrain = $('.js-outbrain-container');
            return $outbrain && $outbrain.length > 0;
        }

      var bottomWriter = function (component) {
            return fastdom.write(function () {
                try {
                    ajax({
                        url: 'http://localhost:9000/user-geo-location.json',
                        method: 'GET',
                        contentType: 'application/json',
                        crossOrigin: true
                    }).then(function (resp) {
                        if(resp.country == 'US') {
                            var submetaElement = $('.submeta');
                            component.insertBefore(submetaElement);
                            embed.init();
                            mediator.emit('contributions-embed:insert', component);
                        }
                    });
                } catch (e) {
                    //Do nothing
                }

            });
      };

       var completer = function (complete) {
            mediator.on('contributions-embed:insert', function () {
                bean.on(qwery('.js-submit-input')[0], 'click', function (){
                    complete();
                });
            });
        };

        this.variants = [

            {
                id: 'control',
                test: function () {
                    var component = $.create(template(contributionsEmbed, {
                        position : 'inline',
                        variant: 'bottom',
                        linkUrl: 'https://contribute.theguardian.com/us?INTCMP=co_usa_donatom&amount=50',
                        currency: '$'

                    }));
                    bottomWriter(component);
                },
                success: completer
            }
        ];
    };
});
