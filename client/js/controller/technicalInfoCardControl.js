'use strict';

/**
 * Technical Info Card Control controls the showing of technical info.
 * @class
 * @example app.controller('technicalInfoCardControl', ['$rootScope', '$scope', 'dataService', 'performanceService', TechnicalInfoCardControl]);
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
         * Formatted time string of when the data was generated.
         * Initialized to empty and later populated when data was downloaded.
         * @type {object}
         * @property {string} text Actual text to be shown.
         */
        this.timestamp = {
            text: ''
        };

        /**
         * Object that controls the showing of performance analysis.
         * @type {object}
         * @property {boolean} isShow Show performance information instead of timestamp.
         * @property {string} text Actual text to be shown.
         */
        this.performance = {
            isShow: false,
            text: ''
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
        $scope.performance = this.performance;
        $scope.timestamp = this.timestamp;
        $scope.htmlTemplate = this.htmlTemplate;

        $rootScope.$broadcast('controllerReady', this.constructor.name);
    }

    /**
     * Show timestamp.
     * @param {object} event Event object supplied by AngularJS.
     * @listens module:DataService#initSuccess
     * @example technicalInfoCardControl.showTimestamp()
     * @example $scope.$on('DataService#initSuccess', this.showTimestamp.bind(this));
     */
    showTimestamp(event) {
        const time = this.dataService.getTimestamp();
        this.timestamp.text = time.toString();
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
            this.performance.text = this.performanceService.getAll().map(JSON.stringify).join('\n');
            this.performance.isShow = true;
        }
    }
}

app.controller('technicalInfoCardControl', ['$rootScope', '$scope', 'dataService', 'performanceService', TechnicalInfoCardControl]);
