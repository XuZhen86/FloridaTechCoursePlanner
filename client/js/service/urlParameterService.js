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
 * @module urlParameterService
 */
app.service('urlParameterService', function urlParameterService($rootScope, $location) {
    /**
     * Get the value associated with the key
     * @param {string} key The key string
     * @returns {string} The value string
     * @example const value = urlParameterService.get('key');
     */
    this.get = function get(key) {
        return $location.search()[key];
    };

    $rootScope.$broadcast('serviceReady', this.constructor.name);
});
