'use strict';

app.config(function urlParameterServiceConfig($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
});

/**
 * URL Parameter Service provides a simple interface to get url parameters.
 * The client should call get() to get the parameter.
 * @class
 * @example app.service('urlParameterService', ['$rootScope', '$location', UrlParameterService]);
 */
class UrlParameterService {
    /**
     * @param {object} $rootScope {@link https://docs.angularjs.org/api/ng/service/$rootScope}
     * @param {object} $location {@link https://docs.angularjs.org/api/ng/service/$location}
     */
    constructor($rootScope, $location) {
        this.$rootScope = $rootScope;
        this.$location = $location;

        $rootScope.$broadcast('serviceReady', this.constructor.name);
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

app.service('urlParameterService', ['$rootScope', '$location', UrlParameterService]);
