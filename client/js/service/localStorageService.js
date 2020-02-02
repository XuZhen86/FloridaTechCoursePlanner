'use strict';

/**
 * Local Storage Service provides a simple interface to store key-value pairs in browser.
 * The pairs are persistent even after closing the tab.
 * Client often use JSON.stringify() to serialize an object in order to store it, then use JSON.parse() to deserialize the object.
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage}
 * @module localStorageService
 */
app.service('localStorageService', function localStorageService($rootScope) {
    /**
     * Set a key-value pair.
     * If the key does not exist, a new pair is created.
     * If the key exists, its value is overwritten.
     * @param {string} key Key string.
     * @param {string} value Value string.
     * @returns {void}
     */
    this.set = function set(key, value) {
        const keyStr = JSON.stringify(key);
        const valueStr = JSON.stringify(value);

        localStorage.setItem(keyStr, valueStr);
    };

    /**
     * Get a value from key.
     * If the value does not exist, return defaultValue.
     * @param {string} key Key string.
     * @param {Object} defaultValue The default value to be returned if no key is found.
     * @returns {string|Object} Either the value that corresponds with the key or the specified default value.
     */
    this.get = function get(key, defaultValue) {
        const keyStr = JSON.stringify(key);
        const valueStr = localStorage.getItem(keyStr);
        const value = JSON.parse(valueStr);

        if (value == null) {
            return defaultValue;
        }

        return value;
    };

    $rootScope.$broadcast('serviceReady', this.constructor.name);
});
