'use strict';

/**
 * Technical Info Card Control controls the showing of technical info.
 * @module technicalInfoCardControl
 * @requires dataService
 * @requires performanceService
 */
app.controller('technicalInfoCardControl', function technicalInfoCardControl($rootScope, $scope, dataService, performanceService) {
    /**
     * Absolute path to HTML template file. Used by ng-include.
     * @name "$scope.url"
     * @type {string}
     * @constant
     * @see {@link https://docs.angularjs.org/api/ng/directive/ngInclude}
     */
    $scope.url = '../html/sectionTable/technicalInfoCard.html';

    /**
     * Show timestamp.
     * @param {object} event Event object supplied by AngularJS.
     * @listens module:dataService#initSuccess
     * @example technicalInfoCardControl.showTimestamp()
     * @example $scope.$on('dataService#initSuccess', this.showTimestamp.bind(this));
     */
    this.showTimestamp = function showTimestamp(event) {
        const time = dataService.getTimestamp();
        $scope.timeString = time.toString();
    };

    // On successful retrieving the data, show data time stamp
    $scope.$on('dataService#initSuccess', this.showTimestamp.bind(this));

    /**
     * Object that controls the showing of performance analysis.
     * @name "$scope.performance"
     * @type {Object}
     */
    $scope.performance = {
        isShow: false,
        text: ''
    };

    /**
     * Number of times the card was clicked.
     * @type {number}
     */
    this.clickCount = 0;

    /**
     * Called when the card is clicked.
     * This function counts how many times the card is clicked, and show performance analysis when it is clicked enough times.
     * @function "$scope.click"
     * @example <md-card id="technicalInfoCard" ng-click="click()" layout-fill>...</md-card>
     */
    $scope.click = function click() {
        this.clickCount++;

        // If the card is spam clicked, show performance analysis
        // If it's already showing analysis, update analysis
        if (this.clickCount >= 7) {
            // Ensure output is in a nice format
            $scope.performance.text = performanceService.getAll().map(JSON.stringify).join('\n');
            $scope.performance.isShow = true;
        }
    }.bind(this);

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});
