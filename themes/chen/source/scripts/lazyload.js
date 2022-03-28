'use strict';
const fs = require('hexo-fs');
const UglifyJS = require('uglify-js');
const lazyLoadPath = './simple-lazyload.js';
const thirdPartyFixPath = './third-party-fix.js';

hexo.extend.filter.register('after_render:html', function lazyProcess(htmlContent) {
    let defaultImagePath = './default-image.json';
    let loadingImage = this.config.lazyload.loadingImg;

    if (!loadingImage) {
        loadingImage = JSON.parse(fs.readFileSync(defaultImagePath)).default;
    }

    return htmlContent.replace(/<img(.*?)src="(.*?)"(.*?)>/gi, function (str, p1, p2) {
        // might be duplicate
        if(/data-original/gi.test(str)){
            return str;
        }
        if(/src="data:image(.*?)/gi.test(str)) {
            return str;
        }
        if(/no-lazy/gi.test(str)) {
            return str;
        }
        return str.replace(p2, loadingImage + '" data-original="' + p2);
    });
});
hexo.extend.filter.register('after_render:html', function(htmlContent){
    let injectSetting = function () {
        return `<script>
            window.imageLazyLoadSetting = {
                isSPA: ${!!this.config.lazyload.isSPA},
                processImages: null,
            };
        </script>`;
    };
    let injectExtraScript = function (filePath) {
        if (!fs.exists(filePath)) throw new TypeError(filePath + ' not found!');
        let sourceCode = fs.readFileSync(filePath, { escape: true });
        return '<script>' + UglifyJS.minify(sourceCode).code + '</script>';
    };
    let appendScript = function(content, htmlContent) {
        let lastIndex = htmlContent.lastIndexOf('</body>');
        return htmlContent.substring(0, lastIndex) + content + htmlContent.substring(lastIndex, htmlContent.length);
    };
    if (/<\/body>/gi.test(htmlContent)) {
        htmlContent = appendScript(injectSetting.bind(this)(), htmlContent);
        htmlContent = appendScript(injectExtraScript(thirdPartyFixPath), htmlContent);
        htmlContent = appendScript(injectExtraScript(lazyLoadPath), htmlContent);
    }
    return htmlContent;
});
