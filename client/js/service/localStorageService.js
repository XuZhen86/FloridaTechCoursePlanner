'use strict';

/**
 * Local Storage Service provides a simple interface to store key-value pairs in browser.
 * The pairs are persistent even after closing the tab.
 * The stored key-value pairs can be viewed and edited in browser's developer mode.
 * @class
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage}
 * @example
app.service('localStorageService', [
    '$rootScope',
    LocalStorageService
]);
 */
class LocalStorageService {
    /**
     * @param {object} $rootScope {@link https://docs.angularjs.org/api/ng/service/$rootScope}
     */
    constructor($rootScope) {
        this.$rootScope = $rootScope;
    }

    /**
     * Set a key-value pair.
     * If the key does not exist, a new pair is created.
     * If the key exists, its value is overwritten.
     * @param {string} key Key string.
     * @param {object} valueObj Value object. It must be serializable using ```JSON.stringify()```.
     * @throws {TypeError} If ```valueObj``` is not serializable.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON}
     * @example localStorageService('My Object', {my: 'My', object: 'Object'});
     */
    set(key, valueObj) {
        const valueStr = JSON.stringify(valueObj);
        localStorage.setItem(key, valueStr);
    }

    /**
     * Get a value from key.
     * If the value does not exist, return defaultValue.
     * @param {string} key Key string.
     * @param {object} [defaultValue={}] The default value to be returned if no key is found.
     * @returns {object} Either deserialized object using ```JSON.parse()``` or ```defaultValue``` if key is not found.
     * @example const myObject = localStorageService.get('My Object', {defaultValue: 'defaultValue'});
     */
    get(key, defaultValue = {}) {
        const valueStr = localStorage.getItem(key);
        const value = JSON.parse(valueStr);

        if (value == null) {
            return defaultValue;
        }

        return value;
    }
}

app.service('localStorageService', [
    '$rootScope',
    LocalStorageService
]);
