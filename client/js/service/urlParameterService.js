'use strict';

app.config(function urlParameterServiceConfig($locationProvider) {
    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
});

// URL Parameter service provides a simple interface to get url parameters
app.service('urlParameterService', function urlParameterService($rootScope, $location) {
    this.get = function (key) {
        return $location.search()[key];
    };

    $rootScope.$broadcast('serviceReady', this.constructor.name);
});
