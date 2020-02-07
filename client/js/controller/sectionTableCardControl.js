'use strict';

// Section Table Card provides a table to view sections
/**
 * Section Table Card Control controls the showing of the section table.
 * @module sectionTableCardControl
 * @requires dataService
 * @requires performanceService
 * @requires clipboardService
 */
app.controller('sectionTableCardControl', function sectionTableCardControl($rootScope, $scope, $mdDialog, dataService, performanceService, clipboardService) {
    /**
     * Absolute path to HTML template file. Used by ng-include.
     * @name "$scope.url"
     * @type {string}
     * @constant
     * @see {@link https://docs.angularjs.org/api/ng/directive/ngInclude}
     */
    $scope.url = '../html/sectionTable/sectionTableCard.html';

    /**
     * Attributes of each column in the section table.
     * ```[0] = Key, [1] = Short name, [2] = Full name```.
     * @name "$scope.columns"
     * @type {string[][]}
     * @constant
     */
    $scope.columns = [
        ['crn', 'CRN', 'CRN'],
        ['subject', 'Subj.', 'Subject'],
        ['course', 'No.', 'Course Number'],
        ['title', 'Title', 'Title'],
        ['instructor', 'Instructor', 'Instructor'],
        ['section', 'Sec.', 'Section'],
        ['times', 'Times', 'Times'],
        ['cap', 'Enroll', 'Enroll'],
        ['cr', 'CR', 'Credit Hour']
    ];

    /**
     * List of all sections.
     * This list stores a copy of ```dataService.getAllSections()```.
     * @type {Section[]}
     */
    this.sections = [];

    /**
     * Number of sections in ```this.sections```.
     * @name "$scope.nTotalSections"
     * @type {number}
     */
    $scope.nTotalSections = 1;

    /**
     * List of showing sections.
     * This list is a subset of ```this.sections```.
     * @name "$scope.sections"
     * @type {Section[]}
     */
    $scope.sections = [];

    /**
     * Number of sections to be shown initially and number of more sections to be shown in each increment.
     * @name "$scope.nShownDelta"
     * @type {number}
     * @constant
     */
    $scope.nShownDelta = 25;

    /**
     * Increase the number of sections shown.
     * @function "$scope.showMore"
     * @see {@link https://docs.angularjs.org/api/ng/filter/limitTo}
     */
    $scope.showMore = function showMore() {
        $scope.nShown += $scope.nShownDelta;
        $scope.nShown = Math.min($scope.sections.length, $scope.nShown);
    };

    /**
     * Reset the number of sections shown.
     * @see {@link https://docs.angularjs.org/api/ng/filter/limitTo}
     */
    this.resetNShown = function resetNShown() {
        $scope.nShown = Math.min($scope.sections.length, $scope.nShownDelta);
    };

    /**
     * Create a copy of all sections and reset number of sections shown.
     * @param {object} event Event object supplied by AngularJS.
     * @example sectionTableCardControl.duplicateSections(event);
     */
    this.duplicateSections = function duplicateSections(event) {
        this.sections = dataService.getAllSections();
        $scope.sections = this.sections;
        $scope.nTotalSections = this.sections.length;
        this.resetNShown();
    };

    // On successful retrieving the data, get a copy of sections
    // Using .bind(this) to ensure correct this pointer
    $scope.$on('dataService#initSuccess', this.duplicateSections.bind(this));

    /**
     * Receive and apply a new filter function.
     * @param {object} event Event object supplied by AngularJS.
     * @param {SectionFilterFunction} filterFn New filter function.
     * @listens module:filterOptionCardControl#updateFilter
     * @example $scope.$on('filterOptionCardControl#updateFilter', this.updateFilter.bind(this));
     */
    this.updateFilter = function updateFilter(event, filterFn) {
        performanceService.start('sectionTableControl.$scope.$on.filterOptionCardControl#updateFilter');
        $scope.sections = this.sections.filter(filterFn);
        this.resetNShown();
        performanceService.stop('sectionTableControl.$scope.$on.filterOptionCardControl#updateFilter');
    };

    // On filter update, update the shown sections with the new filter
    $scope.$on('filterOptionCardControl#updateFilter', this.updateFilter.bind(this));

    /**
     * When the cursor moves into a section button.
     * Broadcast the section's CRN to show details about the section.
     * @function "$scope.mouseEnter"
     * @param {number} crn CRN of the section
     * @example <tr ng-repeat="section in sections | limitTo:nShown" ng-mouseenter="mouseEnter(section.crn)">...</tr>
     */
    $scope.mouseEnter = function mouseEnter(crn) {
        $rootScope.$broadcast('sectionTableCardControl#mouseHoverSection', crn);
    };

    /**
     * Generate style for elements based on values.
     * Usually the return value is fed into ng-style.
     * @function "$scope.style"
     * @param {string} key The type of element.
     * @param {...object[]} args Other objects that supports the processing.
     * @returns {object} An object contains key-value pairs for styling.
     * @see {@link https://docs.angularjs.org/api/ng/directive/ngStyle}
     * @example <span ng-style="style('cap',section.cap)">...</span>
     */
    $scope.style = function style(key, ...args) {
        // Cap has a color ranging from green to red to indicate how full it is
        if (key == 'cap') {
            const [cap] = args;
            let percentEnroll = cap[0] / cap[1];
            if (percentEnroll > 1) {
                percentEnroll = 1;
            }
            // Calculate a number [0,128]
            const color = 128 * (1 - percentEnroll);
            // Use HSL color range, 0=Green, 128=Red
            return { 'color': `hsl(${color}, 50%, 50%)` };
        }

        // Time is red if it's before 9am or after 5pm
        if (key == 'time') {
            const [time] = args;
            if (time < 900 || 1700 <= time) {
                return { 'color': `hsl(0, 50%, 50%)` };
            }
        }

        // Otherwise return no style
        return {};
    };

    /**
     * Sort the list of shown section by specific key.
     * Usually the key is supplied by md-button:ng-click.
     * @function "$scope.sortBy"
     * @param {string} key The attribute in Section used in the sorting process.
     * @example <md-button ng-click="sortBy(column[0])">...</md-button>
     */
    $scope.sortBy = function sortBy(key) {
        $scope.sections.sort(function compare(a, b) {
            // These are number
            // calculate result by minus
            if (key == 'crn' || key == 'course') {
                return a[key] - b[key];
            }

            // These are strings
            // calculate result by string compare
            if (key == 'subject' || key == 'title' || key == 'instructor' || key == 'section') {
                return a[key].localeCompare(b[key]);
            }

            // Compare start and end times of sections
            // -- Pay close attention to this gorgeous algorithm created by Xu --
            // -- It looks naive, but it's everything but naive! --
            if (key == 'times') {
                // Get number of times of both sections
                const aLength = a.times.length;
                const bLength = b.times.length;

                // If both section have no time, keep original order
                if (aLength == 0 && bLength == 0) {
                    return 0;
                }
                // If first section have no time, put it to the back
                if (aLength == 0) {
                    return 1;
                }
                // If second section have no time, put it to the back
                if (bLength == 0) {
                    return -1;
                }
                // In fact, the following code can handle these cases
                // Except the case (!aLength && !bLength)
                // The cost will be running a sort() that is not meaningful

                // At this point, we actually have something to compare

                // Create an empty array
                // Use 'let' because it is going to be overwritten later
                let times = [];

                // Add times of first section, label them with -1
                // -1 means the first section should be placed BEFORE the second section
                times = times.concat(a.times.map(e => e.concat([-1])));

                // Add times of second section, label them with 1
                // 1 means the first section should be placed AFTER the second section
                times = times.concat(b.times.map(e => e.concat([1])));

                // Regular sorting
                // We can use minus to show difference because time is stored as int
                // It may be simplified without using a full-blown sort()
                times.sort(
                    function (a, b) {
                        // If start time is different, compare start time
                        if (a[0] != b[0]) {
                            return a[0] - b[0];
                        }

                        // If end time is different, compare end time
                        else if (a[1] != b[1]) {
                            return a[1] - b[1];
                        }

                        // If reaches this point, it means both sections have the same time
                        // We should maintain the original order of the two sections
                        // The original order is recorded in the label
                        // First section always have -1, second section always have 1
                        // By comparing their label, first section appears to be smaller than second section
                        // In this way, the section order is preserved
                        else {
                            return a[2] - b[2];
                        }
                    }
                );

                // Return the label of the smallest time
                // This label determines which section should be placed first
                return times[0][2];
            }

            // Compare cap number
            // Primarily compare them based on % full
            // Sections with no enroll info are placed at the end and sorted by actual enroll
            // cap[0] = actual enroll, cap[1] = maximum enroll
            if (key == 'cap') {
                // If both sections do not have max enroll
                // Compare their actual enroll
                if (a.cap[1] == 0 && b.cap[1] == 0) {
                    return a.cap[0] - b.cap[0];
                }

                // If section 1 does not have max enroll but section 2 does
                // Section 1 should be placed AFTER section 2
                // Sections with max enroll should always be placed in the front
                if (a.cap[1] == 0) {
                    return 1;
                }

                // If section 2 does not have max enroll but section 1 does
                // Section 1 should be placed BEFORE section 2
                // Sections with max enroll should always be placed in the front
                if (b.cap[1] == 0) {
                    return -1;
                }

                // At this point, both sections do have max enroll
                // Compare their fullness
                // There is no concern on divide by 0 at this point
                return a.cap[0] / a.cap[1] - b.cap[0] / b.cap[1];
            }

            // Compare credit hours
            // They are sorted by lower bound and then upper bound
            if (key == 'cr') {
                if (a.cr[0] != b.cr[0]) {
                    return a.cr[0] - b.cr[0];
                }
                return a.cr[1] - b.cr[1];
            }

            // If the key is unknown
            // Do no sorting by pretending sections are all equal to each other
            return 0;
        });
    };

    /**
     * Change a filter to value.
     * This function is called by HTML button and broadcasts the key-value pair of the filter.
     * @function "$scope.applyFilter"
     * @param {string} key The key used for filtering.
     * @param {string} value The value the filter should change to.
     * @example <md-button ng-click="applyFilter('subject', section.subject)">...</md-button>
     */
    $scope.applyFilter = function applyFilter(key, value) {
        $rootScope.$broadcast('sectionTableControl#applyFilter', key, value);
    };

    /**
     * Supporting object that contains data for the export dialog.
     * @name "$scope.dialog"
     * @type {object}
     * @property {string} header Singleline header string in TSV format.
     * @property {string} value Multiline values string in TSV format.
     */
    $scope.dialog = {
        header: '',
        value: ''
    };

    /**
     * Create a dialog to show exported data.
     * Data is in TSV (Tab-separated values) format and it allows user to copy and paste it into Excel.
     * @function "$scope.export"
     */
    $scope.export = function export_() {
        performanceService.start('sectionTableControl.$scope.export');

        $mdDialog.show({
            clickOutsideToClose: true,
            parent: angular.element(document.body),
            preserveScope: true,
            scope: $scope,
            templateUrl: '../html/sectionTable/exportDialog.html',
        });

        // Generate header
        // It should be 1 line containing column names
        $scope.dialog.header = $scope.columns.map(
            column => column[2]
        ).join('\t');

        // Generate data
        $scope.dialog.value = $scope.sections.map(
            function generateLine(section) {
                let line = '';
                for (const key of $scope.columns) {
                    line += JSON.stringify(section[key[0]]) + '\t';
                }
                return line;
            }
        ).join('\n');

        performanceService.stop('sectionTableControl.$scope.export');
    };

    /**
     * Close the dialog.
     * Should be called by element in the dialog.
     * @name "$scope.closeDialog"
     * @example <md-button class="md-warn md-raised" ng-click="closeDialog()">Close</md-button>...</md-button>
     */
    $scope.closeDialog = function closeDialog() {
        $mdDialog.hide();
    };

    /**
     * Copy element content into clipboard using clipboardService.
     * @name "$scope.copy"
     * @param {string} key Either 'header' or 'data' to indicate which data to copy.
     * @example <md-button class="md-raised" ng-click="copy('header')">Copy header to Clipboard</md-button>
     * @example <md-button class="md-raised" ng-click="copy('data')">Copy data to Clipboard</md-button>
     */
    $scope.copy = function copy(key) {
        if (key == 'header') {
            clipboardService.copyFromId('#exportHeader');
        }
        if (key == 'data') {
            clipboardService.copyFromId('#exportData');
        }
    };

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});

/**
 * Section Table Card Control Mouse Hover Section Event.
 * @event module:sectionTableCardControl#mouseHoverSection
 * @property {number} crn CRN of the section the mouse is hovering over.
 * @example $rootScope.$broadcast('sectionTableCardControl#mouseHoverSection', crn);
 * @example $scope.$on('sectionTableCardControl#mouseHoverSection', (event, crn) => { });
 */
