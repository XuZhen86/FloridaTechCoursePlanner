'use strict';

// Local storage service provides a simple interface to store vars in browser
app.service('localStorageService', function localStorageService($rootScope) {
    // Set a value.
    // If a value does not exist, create a new value
    // If a value exists, overwrite this value
    this.set = function (key, value) {
        const keyStr = JSON.stringify(key);
        const valueStr = JSON.stringify(value);

        localStorage.setItem(keyStr, valueStr);
    };

    // Get a value
    // If a value does not exist, return defaultValue
    this.get = function (key, defaultValue) {
        const keyStr = JSON.stringify(key);
        const valueStr = localStorage.getItem(keyStr);
        const value = JSON.parse(valueStr);

        if (value == null) {
            return defaultValue;
        }

        return value;
    }

    $rootScope.$broadcast('serviceReady', this.constructor.name);
});
