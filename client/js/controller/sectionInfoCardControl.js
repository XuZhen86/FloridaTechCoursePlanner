'use strict';

/**
 * Section Info Card Control controls the showing of detailed information of a section.
 * @module sectionInfoCardControl
 * @requires dataService
 */
app.controller('sectionInfoCardControl', function sectionInfoCardControl($rootScope, $scope, $window, dataService) {
    /**
     * Absolute path to HTML template file. Used by ng-include.
     * @name "$scope.url"
     * @type {string}
     * @constant
     * @see {@link https://docs.angularjs.org/api/ng/directive/ngInclude}
     */
    $scope.url = '../html/sectionTable/sectionInfoCard.html';

    /**
     * Section object to be shown.
     * @name "$scope.section"
     * @type {Section}
     */
    $scope.section = {};

    /**
     * Pick a random section to be shown.
     * Usually called after successful data loading.
     * @param {object} event Event object supplied by AngularJS.
     * @private
     * @listens DataService#initSuccess
     * @example sectionInfoCardControl.showRandomSection(event);
     * @example $scope.$on('DataService#initSuccess', this.showRandomSection.bind(this));
     */
    this.showRandomSection = function showRandomSection(event) {
        $scope.section = dataService.getRandomSection();
    };

    // Show a random section after successful downloading data.
    // Using .bind(this) to ensure correct this pointer
    $scope.$on('DataService#initSuccess', this.showRandomSection.bind(this));

    /**
     * Show a section with CRN.
     * @param {object} event Event object supplied by AngularJS.
     * @param {number} crn CRN of the section to be shown.
     * @private
     * @example sectionInfoCardControl.showSection(event, 12345);
     */
    this.showSection = function showSection(event, crn) {
        const section = dataService.getSection(crn);
        $scope.section = section;
    };

    // Show the section which the mouse is hovering over.
    // Using .bind(this) to ensure correct this pointer
    $scope.$on('sectionTableCardControl#mouseHoverSection', this.showSection.bind(this));

    /**
     * Open PAWS page of the section.
     * @function "$scope.detailedInfo"
     * @todo Replace hard coded term with dynamic term.
     */
    $scope.detailedInfo = function detailedInfo() {
        $window.open(
            `https://nssb-p.adm.fit.edu/prod/bwckschd.p_disp_detail_sched?term_in=202001&crn_in=${$scope.section.crn}`,
            '_blank'
        );
    };

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});
