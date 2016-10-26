@()

@if(conf.Configuration.assets.useHashedBundles) {
    // Polyfill for async script
    (function (document) {
        var script = document.createElement('script');
        script.src = '@Static("javascripts/app.js")';
        var ref = document.getElementsByTagName('script')[0];
        ref.parentNode.insertBefore(script, ref);
    })(document);
} else {
    @JavaScript(common.Assets.js.curl);
    require(['boot']);
}

