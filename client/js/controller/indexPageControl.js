'use strict';

/**
 * Index Page Control controls the showing of index page.
 * @class
 */
class IndexPageControl {
    constructor($rootScope, $scope, $http) {
        this.$rootScope = $rootScope;
        this.$scope = $scope;

        /**
         * Metadata of schedules.
         * @type {object}
         * @private
         */
        this.scheduleMeta = {};

        // Expose variables to HTML
        $scope.scheduleMeta = this.scheduleMeta;

        $http.get('../data/scheduleMeta.json')
            .then(this.scheduleMetaDownloadSuccess.bind(this));
    }

    scheduleMetaDownloadSuccess(response) {
        const scheduleMeta = {
            spring: {},
            summer: {},
            fall: {}
        };

        for (const item of response.data) {
            const pair = item.title;
            scheduleMeta[pair[0]].year = pair[1];
        }

        Object.assign(this.scheduleMeta, scheduleMeta);

        console.log(this.scheduleMeta);
    }
}

app.controller('indexPageControl', [
    '$rootScope',
    '$scope',
    '$http',
    IndexPageControl
]);
