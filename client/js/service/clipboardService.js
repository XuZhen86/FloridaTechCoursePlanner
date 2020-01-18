'use strict';

// Clipboard Service provides a simple interface to interact with clipboard
app.service('clipboardService', function clipboardService($rootScope) {
    // Using document API to copy text in element with id
    // The id should start with '#'
    this.copyFromId = function (id) {
        const text = document.querySelector(id);
        text.select();
        document.execCommand('copy');
    };

    // The paste method is to be implemented

    $rootScope.$broadcast('serviceReady', this.constructor.name);
});
