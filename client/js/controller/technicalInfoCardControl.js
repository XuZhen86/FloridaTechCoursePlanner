'use strict';

/**
 * Technical Info Card Control controls the showing of technical info.
 * @class
 * @example
app.controller('technicalInfoCardControl', [
    '$rootScope',
    '$scope',
    'dataService',
    'performanceService',
    TechnicalInfoCardControl
]);
 */
class TechnicalInfoCardControl {
    /**
     * @param {object} $rootScope {@link https://docs.angularjs.org/api/ng/service/$rootScope}
     * @param {object} $scope {@link https://docs.angularjs.org/guide/scope}
     * @param {DataService} dataService
     * @param {PerformanceService} performanceService
     */
    constructor($rootScope, $scope, dataService, performanceService) {
        this.$rootScope = $rootScope;
        this.$scope = $scope;
        this.dataService = dataService;
        this.performanceService = performanceService;

        /**
         * Absolute path to HTML template file. Used by ng-include.
         * @type {string}
         * @constant
         * @see {@link https://docs.angularjs.org/api/ng/directive/ngInclude}
         */
        this.htmlTemplate = '../html/sectionTable/technicalInfoCard.html';

        /**
         * Object wrapper for the text to be shown on HTML.
         * Initialized to empty and later populated when data was downloaded.
         * @type {object}
         * @property {string} timestampText Formatted text showing timestamp of the data.
         * @property {number} minutesAgo Number of minutes elapsed since timestamp of the data. The text will be red to alert the user if longer than 60 minutes.
         * @property {string} performanceInfo Formatted text showing performance information.
         * @property {boolean} showPerformanceInfo Should the UI show performance info instead.
         */
        this.ui = {
            timestampText: '',
            minutesAgo: 0,
            performanceInfo: '',
            showPerformanceInfo: false
        };

        /**
         * Number of times the card was clicked.
         * @type {number}
         */
        this.clickCount = 0;

        // On successful retrieving the data, show data time stamp
        $scope.$on('DataService#initSuccess', this.showTimestamp.bind(this));

        // Expose variables to HTML
        $scope.click = this.click.bind(this);
        $scope.htmlTemplate = this.htmlTemplate;
        $scope.ui = this.ui;
    }

    /**
     * Show timestamp.
     * @param {object} event Event object supplied by AngularJS.
     * @listens DataService#initSuccess
     * @example technicalInfoCardControl.showTimestamp()
     * @example $scope.$on('DataService#initSuccess', this.showTimestamp.bind(this));
     */
    showTimestamp(event) {
        const timestamp = this.dataService.getTimestamp();
        const minutesAgo = ((new Date()).getTime() - timestamp.getTime()) / (1000*60) | 0;

        this.ui.timestampText = timestamp.toLocaleString();
        this.ui.minutesAgo = minutesAgo;
    }

    /**
     * Called when the card is clicked.
     * This function counts how many times the card is clicked, and show performance analysis when it is clicked enough times.
     * @example <md-card id="technicalInfoCard" ng-click="click()" layout-fill>...</md-card>
     */
    click() {
        this.clickCount++;

        // If the card is spam clicked, show performance analysis
        // If it's already showing analysis, update analysis
        if (this.clickCount >= 7) {
            // Ensure output is in a nice format
            this.ui.performanceInfo = this.performanceService.getAll().map(JSON.stringify).join('\n');
            this.ui.showPerformanceInfo = true;
        }
    }
}

app.controller('technicalInfoCardControl', [
    '$rootScope',
    '$scope',
    'dataService',
    'performanceService',
    TechnicalInfoCardControl
]);
