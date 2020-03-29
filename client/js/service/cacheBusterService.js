'use strict';

/**
 * Cache Buster Service forces reloading of resource by adding a time stamp to each request.
 * @class
 * @example app.service('cacheBusterService', [CacheBusterService]);
 */
class CacheBusterService {
    /**
     * Rewrite URL to include a time stamp. The time stamp changes periodically.
     * The browser and server will have to reload the file if time stamp is different even though the file may be the same.
     * Notice ```this``` pointer in this function is undefined.
     * @param {object} config Config object supplied by AngularJS.
     * @example app.config(['$httpProvider', ($httpProvider) => { $httpProvider.interceptors.push('cacheBusterService'); }]);
     */
    request(config) {
        // Create time stamp by integer division. The result only changes every 'cacheValidDuration' milliseconds.
        const cacheValidDuration = 120 * 1000;
        const cacheTime = (new Date()).getTime() / cacheValidDuration | 0;

        // Extract URL parameters and add a time parameter
        const url = new URL(config.url, document.baseURI);
        url.searchParams.append('cacheTime', `${cacheTime}`);
        console.log('url.href: ', url.href);

        // Overwrite original url
        config.url = url.href;
        return config;
    }
}

app.service('cacheBusterService', [CacheBusterService]);
app.config(['$httpProvider', ($httpProvider) => { $httpProvider.interceptors.push('cacheBusterService'); }]);
