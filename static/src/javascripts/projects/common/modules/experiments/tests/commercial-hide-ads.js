define([
    'common/utils/config'
], function (
    config
) {

    return function () {
        this.id = 'HideAdsDev';
        this.start = '2016-09-28';
        this.expiry = '2016-10-28'; // Test really expires on Thursday 27th @ 01:00 BST to coincide with the switch
        this.author = 'Justin Pinner';
        this.description = 'Hide ads with payment options 404 test (dev)';
        this.audience = 0;
        this.audienceOffset = 0;
        this.audienceCriteria = 'Everyone. Except active ad-blockers.';
        this.idealOutcome = 'People will voluntarily express an interest in a paid-for ad-free offering.';
        this.hypothesis = 'Given the ability to pay to hide adverts, users will demonstrate that there is sufficient demand to justify developing the feature.';

        this.canRun = function () {
            return config.switches.abHideAdsDev === true;
        };

        this.variants = [{
            id: 'variant',
            test: function () {}
        }, {
            id: 'control',
            test: function () {}
        }];

    };

});
