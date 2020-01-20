'use strict';

// Section Table Card provides a table to view sections
app.controller('sectionTableCardControl', function sectionTableCardControl($rootScope, $scope, $mdDialog, dataService, performanceService, clipboardService) {
    $scope.url = '/client/html/sectionTable/sectionTableCard.html';

    // Define attributes of each column in table
    // [key, short name, full name]
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

    // The grand list of sections
    this.sections = [];
    // Number of sections in this.sections
    $scope.nTotalSections = 1;

    // The smaller list of sections that are showing
    $scope.sections = [];

    // Number of more sections to be shown each time
    $scope.nShownDelta = 25;
    // Increase number of sections shown
    $scope.showMore = function () {
        $scope.nShown += $scope.nShownDelta;
        $scope.nShown = Math.min($scope.sections.length, $scope.nShown);
    };
    // Reset number of sections shown
    this.resetNShown = function () {
        $scope.nShown = Math.min($scope.sections.length, $scope.nShownDelta);
    };

    // On successful retrieving the data, get a copy of sections
    $scope.$on('dataService.init.success', function () {
        this.sections = dataService.get('all-sections');
        $scope.sections = this.sections;
        $scope.nTotalSections = this.sections.length;
        this.resetNShown();
    }.bind(this));

    // On filter update, update the shown sections with the new filter
    $scope.$on('filterOptionsControl.updateFilter', function (event, filterFn) {
        performanceService.start('sectionTableControl.$scope.$on.filterOptionsControl.updateFilter');
        $scope.sections = this.sections.filter(filterFn);
        this.resetNShown();
        performanceService.stop('sectionTableControl.$scope.$on.filterOptionsControl.updateFilter');
    }.bind(this));

    // When the mouse is hovering over a section, send its CRN to show details about the section
    $scope.mouseEnter = function (crn) {
        $rootScope.$broadcast('sectionTableControl.updateCrn', crn);
    };

    // Calculate style based on value
    // It should be used with ng-style
    $scope.style = function (key, ...args) {
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

    // Sort shown list by specific key
    // md-button.ng-click should supply the corresponding key
    $scope.sortBy = function (key) {
        $scope.sections.sort(function (a, b) {
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

    // Change filter setting
    // This function is called by pressing a button on UI
    $scope.applyFilter = function (key, value) {
        $rootScope.$broadcast('sectionTableControl.applyFilter', key, value);
    };

    // Export dialog data bundle
    $scope.dialog = {
        header: '',
        value: '',
        isReady: false
    };
    // Create a dialog to show exported data
    // Data is in TSV (Tab-separated values) format
    // TSV allows user to copy and paste data into Excel
    $scope.export = function () {
        performanceService.start('sectionTableControl.$scope.export');

        $mdDialog.show({
            clickOutsideToClose: true,
            parent: angular.element(document.body),
            preserveScope: true,
            scope: $scope,
            templateUrl: '/client/html/sectionTable/exportDialog.html',
        });

        // Generate header
        // It should be 1 line containing column names
        $scope.dialog.header = $scope.columns.map(
            column => column[2]
        ).join('\t');

        // Generate data
        $scope.dialog.value = $scope.sections.map(
            function (section) {
                let line = '';
                for (const key of $scope.columns) {
                    line += JSON.stringify(section[key[0]]) + '\t';
                }
                return line;
            }
        ).join('\n');

        performanceService.stop('sectionTableControl.$scope.export');
    };
    // Close the dialog
    $scope.closeDialog = function () {
        $mdDialog.hide();
    }

    // Copy content into clipboard
    $scope.copy = function (key) {
        if (key == 'header') {
            clipboardService.copyFromId('#exportHeader');
        }
        if (key == 'data') {
            clipboardService.copyFromId('#exportData');
        }
    }

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});
