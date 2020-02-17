'use strict';

/**
 * Section Info Card Control controls the showing of detailed information of a section.
 * @class
 * @example
app.controller('sectionInfoCardControl', [
    '$rootScope',
    '$scope',
    '$window',
    'dataService',
    SectionInfoCardControl
]);
 */
class SectionInfoCardControl {
    /**
     * @param {object} $rootScope {@link https://docs.angularjs.org/api/ng/service/$rootScope}
     * @param {object} $scope {@link https://docs.angularjs.org/guide/scope}
     * @param {object} $window {@link https://docs.angularjs.org/api/ng/service/$window}
     * @param {DataService} dataService
     */
    constructor($rootScope, $scope, $window, dataService) {
        this.$rootScope = $rootScope;
        this.$scope = $scope;
        this.$window = $window;
        this.dataService = dataService;

        /**
         * Absolute path to HTML template file. Used by ng-include.
         * @type {string}
         * @constant
         * @see {@link https://docs.angularjs.org/api/ng/directive/ngInclude}
         */
        this.htmlTemplate = '../html/sectionTable/sectionInfoCard.html';

        /**
         * Section object to be shown.
         * @type {Section}
         */
        this.section = {};

        // Show a random section after successful downloading data.
        // Using .bind(this) to ensure correct this pointer
        $scope.$on('DataService#initSuccess', this.showRandomSection.bind(this));

        // Show the section which the mouse is hovering over.
        // Using .bind(this) to ensure correct this pointer
        $scope.$on('SectionTableCardControl#mouseHoverSection', this.showSection.bind(this));

        // Expose variables to HTML
        $scope.detailedInfo = this.detailedInfo.bind(this);
        $scope.htmlTemplate = this.htmlTemplate;
        $scope.section = this.section;
    }

    /**
     * Pick a random section to be shown.
     * Usually called after successful data loading.
     * @param {object} event Event object supplied by AngularJS.
     * @private
     * @listens DataService#initSuccess
     * @example sectionInfoCardControl.showRandomSection(event);
     * @example $scope.$on('DataService#initSuccess', this.showRandomSection.bind(this));
     */
    showRandomSection(event) {
        const section = this.dataService.getRandomSection();
        // Use Object.assign() to copy content of section object while retain the reference to original object.
        Object.assign(this.section, section);
    }

    /**
     * Show a section with CRN.
     * @param {object} event Event object supplied by AngularJS.
     * @param {number} crn CRN of the section to be shown.
     * @private
     * @listens SectionTableCardControl#mouseHoverSection
     * @example $scope.$on('SectionTableCardControl#mouseHoverSection', this.showSection.bind(this));
     * @example sectionInfoCardControl.showSection(event, 12345);
     */
    showSection(event, crn) {
        const section = this.dataService.getSection(crn);
        // Use Object.assign() to copy content of section object while retain the reference to original object.
        Object.assign(this.section, section);
    }

    /**
     * Open PAWS page of the section.
     * This function automatically determines which semester to use in URL.
     * @example <md-button class="md-raised" ng-click="detailedInfo()">Open on PAWS</md-button>
     */
    detailedInfo() {
        const termInMonth = {
            spring: '01',
            summer: '05',
            fall: '08'
        };

        const meta = this.dataService.getSemesterMeta();
        const termIn = `${meta.year}${termInMonth[meta.semester]}`;

        this.$window.open(
            `https://nssb-p.adm.fit.edu/prod/bwckschd.p_disp_detail_sched?term_in=${termIn}&crn_in=${this.section.crn}`,
            '_blank'
        );
    }
}

app.controller('sectionInfoCardControl', [
    '$rootScope',
    '$scope',
    '$window',
    'dataService',
    SectionInfoCardControl
]);
