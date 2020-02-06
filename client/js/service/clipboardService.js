'use strict';

/**
 * Clipboard Service provides a simple interface allowing JS to interact with browser clipboard.
 * @module clipboardService
 */
app.service('clipboardService', function clipboardService($rootScope) {
    /**
     * Copy text from HTML element with specified ID, so that the user do not have to manually select all and copy the text.
     * This function uses Document API to select the text from an HTML element, then execute a command to copy the text to clipboard.
     * Despite not all commands are supported by browsers, the copy command is universally supported.
     * @param {string} id ID of the element to copy text from. ID should start with '#'.
     * @todo Rewrite using Clipboard API when Clipboard API is universally supported.
     * @see {@link https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Interact_with_the_clipboard}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Clipboard#Browser_compatibility}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand}
     * @example clipboardService.copyFromId('#MyElement');
     */
    this.copyFromId = function copyFromId(id) {
        const element = document.querySelector(id);
        element.select();
        document.execCommand('copy');
    };

    // The paste method is to be implemented

    $rootScope.$broadcast('serviceReady', this.constructor.name);
});
