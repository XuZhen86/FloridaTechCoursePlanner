'use strict';

class UrlParameterServiceConfig {
    constructor($locationProvider) {
        $locationProvider.html5Mode({
            enabled: true,
            requireBase: false
        });
    }
}

app.config([
    '$locationProvider',
    UrlParameterServiceConfig
]);

/**
 * URL Parameter Service provides a simple interface to get url parameters.
 * The client should call get() to get the parameter.
 * @class
 * @example
app.service('urlParameterService', [
    '$rootScope',
    '$location',
    UrlParameterService
]);
 */
class UrlParameterService {
    /**
     * @param {object} $rootScope {@link https://docs.angularjs.org/api/ng/service/$rootScope}
     * @param {object} $location {@link https://docs.angularjs.org/api/ng/service/$location}
     */
    constructor($rootScope, $location) {
        this.$rootScope = $rootScope;
        this.$location = $location;
    }

    /**
     * Get the value associated with the key
     * @param {string} key The key string
     * @returns {string} The value string
     * @example const value = urlParameterService.get('key');
     */
    get(key) {
        return this.$location.search()[key];
    }
}

app.service('urlParameterService', [
    '$rootScope',
    '$location',
    UrlParameterService
]);
