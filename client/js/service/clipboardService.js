'use strict';

/**
 * Clipboard Service provides a simple interface to interact with clipboard.
 * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard}
 * @module clipboardService
 */
app.service('clipboardService', function clipboardService($rootScope) {
    /**
     * Copy text from element with id using document API.
     * @param {string} id Id of the element to copy text from. Id should start with '#'.
     * @returns {void}
     * @todo Rewrite using Clipboard API when it is universally supported.
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Clipboard#Clipboard_availability}
     */
    this.copyFromId = function copyFromId(id) {
        const text = document.querySelector(id);
        text.select();
        document.execCommand('copy');
    };

    // The paste method is to be implemented

    $rootScope.$broadcast('serviceReady', this.constructor.name);
});
