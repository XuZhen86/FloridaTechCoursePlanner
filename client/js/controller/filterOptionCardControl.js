'use strict';

/**
 * Filter Option Card Control controls the showing of filters card.
 * @class
 * @example
app.controller('filterOptionCardControl', [
    '$rootScope',
    '$scope',
    '$element',
    'dataService',
    'urlParameterService',
    FilterOptionCardControl
]);
 */
class FilterOptionCardControl {
    /**
     * @param {object} $rootScope {@link https://docs.angularjs.org/api/ng/service/$rootScope}
     * @param {object} $scope {@link https://docs.angularjs.org/guide/scope}
     * @param {object} $element {@link https://docs.angularjs.org/api/ng/function/angular.element}
     * @param {DataService} dataService
     * @param {UrlParameterService} urlParameterService
     */
    constructor($rootScope, $scope, $element, dataService, urlParameterService) {
        this.$rootScope = $rootScope;
        this.$scope = $scope;
        this.$element = $element;
        this.dataService = dataService;
        this.urlParameterService = urlParameterService;

        /**
         * Absolute path to HTML template file. Used by ng-include.
         * @type {string}
         * @constant
         * @see {@link https://docs.angularjs.org/api/ng/directive/ngInclude}
         */
        this.htmlTemplate = '../html/sectionTable/filterOptionCard.html';

        /**
         * 2D array of configuring filters.
         * The rows and columns correspond to the filter layout on HTML.
         * @type {FilterConfig[][]}
         */
        this.filterConfig = [];

        // On successful retrieving the data, generate lists for filters
        $scope.$on('DataService#initSuccess', this.generateFilters.bind(this));

        // Receive event from clients to change the value of a filter
        $scope.$on('SectionTableControl#applyFilterValue', this.applyFilterValue.bind(this));

        // Expose variables to HTML
        $scope.clear = this.clear.bind(this);
        $scope.clearAll = this.clearAll.bind(this);
        $scope.disableAll = this.disableAll.bind(this);
        $scope.filterConfig = this.filterConfig;
        $scope.htmlTemplate = this.htmlTemplate;
        $scope.newFilter = this.newFilter.bind(this);
        $scope.openSelections = this.openSelections.bind(this);
        $scope.optionFormat = this.optionFormat.bind(this);
    }

    /**
     * Generate config array for filters.
     * @param {object} event Event object supplied by AngularJS.
     * @listens DataService#initSuccess
     * @example filterOptionCardControl.generateFilters(event);
     * @example $scope.$on('DataService#initSuccess', this.generateFilters.bind(this));
     */
    generateFilters(event) {
        // Get all sections
        const sections = this.dataService.getAllSections();

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
                    options: this.dataService.getSubjects().map(subject => subject.subject),
                    placeHolder: 'Search subject',  // Grey text shown when nothing is selected
                    property: 'subject' // Key name in section object
                }, {    // Column 2
                    ariaLabel: "Course number filter switch",
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
                    ariaLabel: "Title filter switch",
                    enable: false,
                    input: '',
                    label: 'Title',
                    model: undefined,
                    // It uses the same method as generating list of course number
                    options: Array.from(new Set(sections.map(section => section.title))).sort(),
                    placeHolder: 'Search title',
                    property: 'title'
                }, {    // Column 2
                    ariaLabel: "Instructor filter switch",
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
                    ariaLabel: "Tags filter switch",
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
                    ariaLabel: "Credit hours switch",
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

        // Add a filter of sessions only for summer
        if (this.dataService.getSemesterMeta().semester == 'summer') {
            filterConfig.push(
                [   // Row 4
                    {   // Column 1
                        ariaLabel: "Sessions filter switch",
                        enable: false,
                        input: '',
                        label: 'Session',
                        model: undefined,
                        options: Array.from(new Set(sections.map(section => section.session))).sort(),
                        placeHolder: 'Search session',
                        property: 'session'
                    }
                ]
            );
        }

        // Get data from URL to pre-fill filters
        for (const filter of filterConfig.flat()) {
            filter.model = this.urlParameterService.get(filter.property);
            if (filter.model != undefined) {
                filter.enable = true;
            }
        }

        // Install filter config.
        this.filterConfig.splice(0, this.filterConfig.length, ...filterConfig);

        // Required for having a searchbar in the list
        // It prevents list from intercepting keystrokes when typing into the searchbar
        // Delaying 2 seconds for AngularJS to create elements, then change settings on inputs.
        setTimeout(() => {
            this.$element.find('input').on('keydown', ev => ev.stopPropagation());
        }, 2000);

        // Fire filter change to send out the first filter
        this.newFilter();
    }

    /**
     * Enable filter and simulate a click on selections.
     * This function does nothing if the filter is already enabled.
     * @param {FilterConfig} filter
     * @example <md-input-container flex ng-click="openSelections(filter)">...</md-input-container>
     */
    openSelections(filter) {
        // Only simulate a click when the filter is not enabled.
        // Otherwise it generates an infinite loop of clicking and scheduling another click.
        if (filter.enable) {
            return;
        }

        filter.enable = true;
        setTimeout(() => {
            document.getElementById(filter.label).click();
        }, 0);
    }

    /**
      * Update a filter's value.
      * If the key does not exist, do nothing.
      * @param {object} event Event object supplied by AngularJS.
      * @param {string} key Select filter with property equals key.
      * @param {string} value Filter value to change to.
      * @listens SectionTableControl#applyFilterValue
      * @example filterOptionCardControl.changeFilter(event, 'subject', 'CSE');
      * @example $scope.$on('SectionTableControl#applyFilterValue', this.applyFilterValue.bind(this));
      */
    applyFilterValue(event, key, value) {
        let validKey = false;

        // Loop through filters to match the key
        for (const filter of this.filterConfig.flat()) {
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
            this.newFilter();
        }
    }

    /**
     * Format option that is Array[2] into string.
     * Otherwise return unmodified option object.
     * @param {object} option Option object. Usually passed from HTML.
     * @returns {string} If ```option``` is Array[2].
     * @returns {object} If ```option``` is not Array[2].
     * @example <md-option ng-repeat="option in filter.options | filter:filter.input" ng-value="option">{{optionFormat(option)}}</md-option>
     */
    optionFormat(option) {
        if (option instanceof Array && option.length == 2) {
            return `${option[0]} - ${option[1]}`;
        }
        return option;
    }

    /**
     * Generate a new filter function and broadcast the filter function.
     * This function is called whenever the filter changes.
     * @example <md-switch ng-model="filter.enable" aria-label={{filter.ariaLabel}} ng-change="filterChange()"></md-switch>
     * @example <md-select ng-disabled="!filter.enable" ng-model="filter.model" ng-change="filterChange()" flex>...</md-select>
     * @fires FilterOptionCardControl#newFilter
     */
    newFilter() {
        // Reduce nested array to 1-D array for easier looping
        const filterConfig = this.filterConfig.flat();

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
        this.$rootScope.$broadcast('FilterOptionCardControl#newFilter', filterFn);
    }

    /**
     * Disable all filters without changing the values.
     * @example <md-button class="md-raised" ng-click="disableAll()">Disable All</md-button>
     */
    disableAll() {
        for (const filter of this.filterConfig.flat()) {
            filter.enable = false;
        }
        this.newFilter();
    }

    /**
     * Disable all filters and clear the values.
     * @example <md-button class="md-raised md-warn" ng-click="clearAll()">Reset</md-button>
     */
    clearAll() {
        for (const filter of this.filterConfig.flat()) {
            filter.enable = false;
            filter.model = undefined;
        }
        this.newFilter();
    }

    /**
     * Clear the value of a filter.
     * @param {object} filter Filter object. Usually passed from HTML.
     * @example <md-button class="md-warn" ng-click="clear(filter)">Clear</md-button>
     */
    clear(filter) {
        filter.input = '';
        filter.model = undefined;
        this.newFilter();
    }
}

app.controller('filterOptionCardControl', [
    '$rootScope',
    '$scope',
    '$element',
    'dataService',
    'urlParameterService',
    FilterOptionCardControl
]);

// Fix Edge does not have Array.prototype.flat() and causing filters not showing up
// https://stackoverflow.com/a/57714483
if (Array.prototype.flat == undefined) {
    Object.defineProperty(
        Array.prototype,
        'flat',
        {
            value: function (depth = 1, stack = []) {
                for (const item of this) {
                    if (item instanceof Array && depth > 0) {
                        item.flat(depth - 1, stack);
                    } else {
                        stack.push(item);
                    }
                }
                return stack;
            }
        }
    );
}

/**
 * Function object that is used to filter sections.
 * @typedef {Function} SectionFilterFunction
 * @param {Section} section The section to be tested.
 * @returns {boolean} If the section should be kept in the list.
 */

/**
 * Filter Option Card Control Update Filter Event.
 * @event FilterOptionCardControl#newFilter
 * @property {SectionFilterFunction} filterFn Section filter function.
 * @example $rootScope.$broadcast('FilterOptionCardControl#newFilter', filterFn);
 * @example $scope.$on('FilterOptionCardControl#newFilter', (event, filterFn) => { });
 */

/**
 * Object that stores configurations about a filter.
 * @typedef {object} FilterConfig
 * @property {string} ariaLabel Aria label for switch to improve accessibility.
 * @property {boolean} enable If the switch is turned on. It also determines if the filter is applied.
 * @property {string} input Holds user input on the search bar.
 * @property {string} model Holds user selection from the list.
 * @property {object[]} options Available options. Exact type is determined when initializing.
 * @property {string} placeHolder The grey text shown when nothing is selected.
 * @property {string} property The key name in Section object.
 */
