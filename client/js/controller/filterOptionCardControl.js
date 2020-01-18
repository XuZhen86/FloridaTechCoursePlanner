'use strict';

// Filter Option Card controls the application of filters
app.controller('filterOptionCardControl', function filterOptionCardControl($rootScope, $scope, $element, dataService, urlParameterService) {
    $scope.url = '/client/html/sectionTable/filterOptionCard.html';

    // On successful retrieving the data, generate lists for filters
    $scope.$on('dataService.init.success', async function () {
        // Get all sections
        const sections = await dataService.get('all-sections');

        // Generate data for each filter
        // The nested array arrangement determine the row/col arrangement on html
        const filterConfig = [
            [   // Row 1
                {   // Column 1
                    ariaLabel: "Subject filter switch",   // Needed for switch
                    enable: false,  // Switch is turned on/off
                    input: '',  // Store search bar input
                    label: 'Subject',
                    model: undefined,   // List selection
                    // Generate the list of subject by:
                    // filtering out unnecessary info
                    // The result is already sorted
                    options: (await dataService.get('subjects')).map(e => e.subject),
                    placeHolder: 'Search subject',  // Grey text shown when nothing is selected
                    property: 'subject' // Key name in section object
                }, {    // Column 2
                    ariaLabel: "Course number filter checkbox",
                    enable: false,
                    input: '',
                    label: 'Course Number',
                    model: undefined,
                    // Generate list of course number by:
                    // Filter out unnecessary info,
                    // Remove duplicates using Set()
                    // Transform into Array and sort
                    options: Array.from(new Set(sections.map(e => e.course))).sort(),
                    placeHolder: 'Search course number',
                    property: 'course'
                }
            ], [    // Row 2
                {   // Column 1
                    ariaLabel: "Title filter checkbox",
                    enable: false,
                    input: '',
                    label: 'Title',
                    model: undefined,
                    // It uses the same method as generating list of course number
                    options: Array.from(new Set(sections.map(e => e.title))).sort(),
                    placeHolder: 'Search title',
                    property: 'title'
                }, {    // Column 2
                    ariaLabel: "Instructor filter checkbox",
                    enable: false,
                    input: '',
                    label: 'Instructor',
                    model: undefined,
                    // It uses the same method as generating list of course number,
                    // Except the name could be empty.
                    // Filter empty names using filter()
                    options: Array.from(new Set(sections.map(e => e.instructor))).sort().filter(e => e.length > 0),
                    placeHolder: 'Search instructor',
                    property: 'instructor'
                }
            ], [    // Row 3
                {   // Column 1
                    ariaLabel: "Tags filter checkbox",
                    enable: false,
                    input: '',
                    label: 'Tags',
                    model: undefined,
                    // For every section, collect tag info into a Map
                    // Map auto eliminates duplication
                    // Transform Map into array
                    options: Array.from(sections.reduce(
                        function (accumulator, currentValue) {
                            for (const tag of currentValue.tags) { accumulator.set(tag[0], tag[1]); }
                            return accumulator;
                        }, new Map()
                    )),
                    placeHolder: 'Search tags',
                    property: 'tags'
                }, {    // Column 2
                    ariaLabel: "Credit hours checkbox",
                    enable: false,
                    input: '',
                    label: 'Credit Hours',
                    model: undefined,
                    // Credit hours range [0, 12], which is [0, 13) for int
                    options: Array.from(Array(12 + 1).keys()),
                    placeHolder: 'Search credit hours',
                    property: 'cr'
                }
            ]
        ];

        // Get data from URL to pre-fill filters
        for (const filter of filterConfig.flat()) {
            filter.model = urlParameterService.get(filter.property);
            if (filter.model != undefined) {
                filter.enable = true;
            }
        }

        // Install filter config.
        // $apply() is required because this function is not in scope?
        $scope.$apply($scope.filterConfig = filterConfig);

        // Required for having a searchbar in the list
        // It prevents list from intercepting keystrokes when typing into the searchbar
        $element.find('input').on('keydown', ev => ev.stopPropagation());

        // Fire filter change to send out the first filter
        $scope.filterChange();
    });

    // Receive event from clients to change the value of a filter
    $scope.$on('sectionTableControl.applyFilter', function (event, key, value) {
        let validKey = false;

        // Loop through filters to match the key
        for (const filter of $scope.filterConfig.flat()) {
            // If the key is matched
            // Update the value, enable the filter, and exit the loop
            if (filter.property == key) {
                filter.model = value;
                filter.enable = true;
                validKey = true;
                break;
            }
        }

        // If the value is applied, send the updated filter
        // Otherwise do nothing
        if (validKey) {
            $scope.filterChange();
        }
    });

    // Generate nice on-screen display for option that is array[2]
    $scope.optionFormat = function (option) {
        if (option instanceof Array && option.length == 2) {
            return `${option[0]} - ${option[1]}`;
        }
        return option;
    };

    // Generate filter function and send out the function
    $scope.filterChange = function () {
        // Reduce nested array to 1-D array for easier looping
        const filterConfig = $scope.filterConfig.flat();

        // Construct filter function
        const filterFn = function (section) {
            for (const filter of filterConfig) {
                // If there is no value or the filter is not enabled,
                // Skip this filter
                if (filter.model == undefined || !filter.enable) {
                    continue;
                }

                // Special cases
                if (filter.property == 'tags') {
                    if (section.tags.find(tag => tag[0] == filter.model[0]) == undefined) {
                        return false;
                    }
                } else if (filter.property == 'cr') {
                    if (filter.model < section.cr[0] || section.cr[1] < filter.model) {
                        return false;
                    }
                } else {    // General case
                    if (filter.model != section[filter.property]) {
                        return false;
                    }
                }
            }

            return true;
        };

        // Send function
        $rootScope.$broadcast('filterOptionsControl.updateFilter', filterFn);
    };

    // Disable all filters without change their values
    $scope.disableAll = function () {
        for (const filter of $scope.filterConfig.flat()) {
            filter.enable = false;
        }
        $scope.filterChange();
    };

    // Disable and clear all filters
    $scope.clearAll = function () {
        for (const filter of $scope.filterConfig.flat()) {
            filter.enable = false;
            filter.model = undefined;
        }
        $scope.filterChange();
    };

    // Clear 1 filter
    $scope.clear = function (filter) {
        filter.input = '';
        filter.model = undefined;
        $scope.filterChange();
    }

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});
