'use strict';

/**
 * Filter Option Card Control controls the showing of filters card.
 * @module filterOptionCardControl
 * @requires dataService
 * @requires urlParameterService
 */
app.controller('filterOptionCardControl', function filterOptionCardControl($rootScope, $scope, $element, dataService, urlParameterService) {
    /**
     * Absolute path to HTML template file. Used by ng-include.
     * @name "$scope.url"
     * @type {string}
     * @constant
     * @see {@link https://docs.angularjs.org/api/ng/directive/ngInclude}
     */
    $scope.url = '../html/sectionTable/filterOptionCard.html';

    /**
     * Generate config array for filters.
     * @param {object} event Event object supplied by AngularJS.
     * @listens DataService#initSuccess
     * @example filterOptionCardControl.generateFilters(event);
     * @example $scope.$on('DataService#initSuccess', this.generateFilters.bind(this));
     */
    this.generateFilters = function generateFilters(event) {
        // Get all sections
        const sections = dataService.getAllSections();

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
                    options:  dataService.getSubjects().map(subject => subject.subject),
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
                    options: Array.from(new Set(sections.map(section => section.course))).sort(),
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
                    options: Array.from(new Set(sections.map(section => section.title))).sort(),
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
                    options: Array.from(new Set(sections.map(section => section.instructor))).sort().filter(name => name.length > 0),
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
                        function reduce(accumulator, currentValue) {
                            for (const tag of currentValue.tags) {
                                accumulator.set(tag[0], tag[1]);
                            }
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
        $scope.filterConfig = filterConfig;

        // Required for having a searchbar in the list
        // It prevents list from intercepting keystrokes when typing into the searchbar
        // Delaying 2 seconds for AngularJS to create elements, then change settings on inputs.
        setTimeout(() => {
            $element.find('input').on('keydown', ev => ev.stopPropagation());
        }, 2000);

        // Fire filter change to send out the first filter
        $scope.filterChange();
    };

    // On successful retrieving the data, generate lists for filters
    $scope.$on('DataService#initSuccess', this.generateFilters.bind(this));

    /**
     * Change a filter's value.
     * If the key does not exist, do nothing.
     * @param {object} event Event object supplied by AngularJS.
     * @param {string} key Select filter with property equals key.
     * @param {string} value Filter value to change to.
     * @listens module:sectionTableControl#applyFilter
     * @example filterOptionCardControl.changeFilter(event, 'subject', 'CSE');
     * @example $scope.$on('sectionTableControl#applyFilter', this.changeFilter.bind(this));
     */
    this.changeFilter = function changeFilter(event, key, value) {
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
    };

    // Receive event from clients to change the value of a filter
    $scope.$on('sectionTableControl#applyFilter', this.changeFilter.bind(this));

    /**
     * Format option that is Array[2] into string.
     * Otherwise return unmodified option object.
     * @function "$scope.optionFormat"
     * @param {object} option Option object. Usually passed from HTML.
     * @returns {string} If ```option``` is Array[2].
     * @returns {object} If ```option``` is not Array[2].
     * @example <md-option ng-repeat="option in filter.options | filter:filter.input" ng-value="option">{{optionFormat(option)}}</md-option>

     */
    $scope.optionFormat = function optionFormat(option) {
        if (option instanceof Array && option.length == 2) {
            return `${option[0]} - ${option[1]}`;
        }
        return option;
    };

    /**
     * Generate a new filter function and broadcast the filter function.
     * This function is called whenever the filter changes.
     * @function "$scope.filterChange"
     * @example <md-switch ng-model="filter.enable" aria-label={{filter.ariaLabel}} ng-change="filterChange()"></md-switch>
     * @example <md-select ng-disabled="!filter.enable" ng-model="filter.model" ng-change="filterChange()" flex>...</md-select>
     * @fires module:filterOptionCardControl#updateFilter
     */
    $scope.filterChange = function filterChange() {
        // Reduce nested array to 1-D array for easier looping
        const filterConfig = $scope.filterConfig.flat();

        // Construct filter function
        const filterFn = function filterFn(section) {
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
        $rootScope.$broadcast('filterOptionCardControl#updateFilter', filterFn);
    };

    /**
     * Disable all filters without changing the values.
     * @function "$scope.disableAll"
     * @example <md-button class="md-raised" ng-click="disableAll()">Disable All</md-button>
     */
    $scope.disableAll = function disableAll() {
        for (const filter of $scope.filterConfig.flat()) {
            filter.enable = false;
        }
        $scope.filterChange();
    };

    /**
     * Disable all filters and clear the values.
     * @function "$scope.clearAll"
     * @example <md-button class="md-raised md-warn" ng-click="clearAll()">Reset</md-button>
     */
    $scope.clearAll = function clearAll() {
        for (const filter of $scope.filterConfig.flat()) {
            filter.enable = false;
            filter.model = undefined;
        }
        $scope.filterChange();
    };

    /**
     * Clear the value of a filter.
     * @function "$scope.clear"
     * @param {object} filter Filter object. Usually passed from HTML.
     * @example <md-button class="md-warn" ng-click="clear(filter)">Clear</md-button>
     */
    $scope.clear = function clear(filter) {
        filter.input = '';
        filter.model = undefined;
        $scope.filterChange();
    };

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});

/**
 * Function object that is used to filter sections.
 * @typedef {Function} SectionFilterFunction
 * @param {Section} section The section to be tested.
 * @returns {boolean} If the section should be kept in the list.
 */

/**
 * Filter Option Card Control Update Filter Event.
 * @event module:filterOptionCardControl#updateFilter
 * @property {SectionFilterFunction} filterFn Section filter function.
 * @example $rootScope.$broadcast('filterOptionCardControl#updateFilter', filterFn);
 * @example $scope.$on('filterOptionCardControl#updateFilter', (event, filterFn) => { });
 */
