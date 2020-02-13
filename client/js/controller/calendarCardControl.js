'use strict';

/**
 * Calendar Card Control controls the calendar.
 * @class
 * @example
app.controller('calendarCardControl', [
    '$rootScope',
    '$scope',
    '$mdDialog',
    'semesterService',
    'dataService',
    'pdfService',
    CalendarCardControl
]);
 */
class CalendarCardControl {
    /**
     * @param {object} $rootScope {@link https://docs.angularjs.org/api/ng/service/$rootScope}
     * @param {object} $scope {@link https://docs.angularjs.org/guide/scope}
     * @param {object} $mdDialog {@link https://material.angularjs.org/latest/api/service/$mdDialog}
     * @param {SemesterService} semesterService
     * @param {DataService} dataService
     * @param {PdfService} pdfService
     */
    constructor($rootScope, $scope, $mdDialog, semesterService, dataService, pdfService) {
        this.$rootScope = $rootScope;
        this.$scope = $scope;
        this.$mdDialog = $mdDialog;
        this.semesterService = semesterService;
        this.dataService = dataService;
        this.pdfService = pdfService;

        /**
         * Absolute path to HTML template file. Used by ng-include.
         * @type {string}
         * @constant
         * @see {@link https://docs.angularjs.org/api/ng/directive/ngInclude}
         */
        this.htmlTemplate = '../html/semesterPlanner/calendarCard.html';

        // Reserved for development purposes.
        // Uncomment it to switch to Summary tab after loading.
        // So that you do not have to manually switch it every time after it reloads.
        // this.tabIndex = 1;

        /**
         * Configuration object for the calendar.
         * @type {object}
         * @property {string} viewType Type of calendar to be shown.
         * @property {number} cellHeight Height in pixels of each cell. Every hour has 2 cells.
         * @property {number} businessBeginsHour Shade hours before this hour and auto scroll calendar to this hour after startup.
         * @property {number} businessEndsHour Shade hours after this hour.
         * @property {string} headerDateFormat Show day of the week only, do not show date of the month.
         * @property {function} onEventResized See function definition for details.
         * @property {function} onEventMoved See function definition for details.
         * @property {function} onEventClicked See function definition for details.
         * @property {function} onTimeRangeSelected See function definition for details.
         * @constant
         * @see {@link https://builder.daypilot.org/calendar}
         */
        this.config = {
            viewType: 'Week',
            cellHeight: 32,
            businessBeginsHour: 8,
            businessEndsHour: 22,
            headerDateFormat: 'dddd',
        };
        this.config.onEventClicked = this.onEventClicked.bind(this);
        this.config.onEventMoved = this.onEventMoved.bind(this);
        this.config.onEventResized = this.onEventResized.bind(this);
        this.config.onTimeRangeSelected = this.onTimeRangeSelected.bind(this);

        /**
         * Supportive object containing information for the change block out dialog.
         * @type {object}
         * @property {string} eventTitle Title of the event. It is tied to user input.
         */
        this.changeBlockOutDialog = {
            eventTitle: ''
        };

        /**
         * Supportive object containing information for the add block out dialog.
         * @type {object}
         * @property {string} eventTitle Title of the event. It is tied to user input.
         */
        this.addBlockOutDialog = {
            // colors: Object.keys($mdColorPalette),
            // color: 'light-blue',
            eventTitle: ''
        };

        /**
         * List of sections shown in Summary table.
         * @type {Section[]}
         */
        this.sections = [];

        /**
         * Column titles for Summary table.
         * @type {string[]}
         * @constant
         */
        this.columns = [
            'CRN',
            'Prefix',
            'Course No.',
            'Sec.',
            'Title',
            'Day',
            'Times',
            'Place',
            'CRs.',
            ''
        ];

        /**
         * Events to be shown on calendar.
         * @type {object[]}
         */
        this.events = [];

        // On refreshing sections, generate events and show them
        $scope.$on('SemesterService#updateSections', this.updateSections.bind(this));

        // Expose variables to HTML
        $scope.addBlockOutDialog = this.addBlockOutDialog;
        $scope.changeBlockOutDialog = this.changeBlockOutDialog;
        $scope.clearBlockOuts = this.clearBlockOuts.bind(this);
        $scope.clearSections = this.clearSections.bind(this);
        $scope.columns = this.columns;
        $scope.config = this.config;
        $scope.dialogCancel = this.dialogCancel.bind(this);
        $scope.dialogConfirm = this.dialogConfirm.bind(this);
        $scope.events = this.events;
        $scope.generateRegForm = this.generateRegForm.bind(this);
        $scope.htmlTemplate = this.htmlTemplate;
        $scope.sections = this.sections;
    }

    /**
     * Process resizing of any event shown on calendar.
     * Called by the calendar when user resizes a shown event.
     * @param {object} args Object containing all kinds of information about the resizing.
     */
    onEventResized(args) {
        const type = args.e.data.type;

        // If user tries to resize a section
        // Undo any change by requesting a refresh
        if (type == 'section' || type == 'tempSection') {
            this.semesterService.broadcastSections();
        }

        // If user tries to resize a block out
        // Delete the original and create a new one
        if (type == 'blockOut') {
            const blockOut = args.e.data;
            this.semesterService.removeBlockOut(blockOut.id);
            this.semesterService.addBlockOut(blockOut.text, blockOut.start, blockOut.end);
        }
    }

    /**
     * Process moving of any event shown on calendar.
     * Called by the calendar when user drags and moves a shown event.
     * @param {object} args Object containing all kinds of information about the moving.
     */
    onEventMoved(args) {
        const type = args.e.data.type;

        // If user tries to move a section
        // Undo any change by requesting a refresh
        if (type == 'section' || type == 'tempSection') {
            this.semesterService.broadcastSections();
        }

        // If user tries to move a block out
        // Delete the original and create a new one
        if (type == 'blockOut') {
            const blockOut = args.e.data;
            this.semesterService.removeBlockOut(blockOut.id);
            this.semesterService.addBlockOut(blockOut.text, blockOut.start, blockOut.end);
        }
    }

    /**
     * Process clicking of any event shown on a calendar.
     * Called by the calendar when user clicks a shown event.
     * @param {object} args Object containing all kinds of information about the clicking.
     */
    onEventClicked(args) {
        const type = args.e.data.type;

        // If user clicks a section
        // Take then to the course of this section
        if (type == 'section' || type == 'tempSection') {
            const crn = args.e.data.crn;
            const section = this.dataService.getSection(crn);
            this.$rootScope.$broadcast('CalendarCardControl#gotoCourse', section.subject, section.course);
        }

        // If user clicks a block out
        // Prompt for a name modification
        if (type == 'blockOut') {
            const id = args.e.data.id;
            const text = args.e.data.text;
            const start = args.e.data.start.value;
            const end = args.e.data.end.value;

            // Initialize content of text box
            this.changeBlockOutDialog.eventTitle = text;

            this.$mdDialog.show({
                contentElement: '#changeBlockOutDialog',
                clickOutsideToClose: true
            }).then(
                // On confirm, do one of the following
                function confirm(args) {
                    // Change title of the event
                    // Remove the event then add a same one with different title
                    if (args[0] == 'title') {
                        // Get new title
                        const title = this.changeBlockOutDialog.eventTitle;
                        this.semesterService.removeBlockOut(id);
                        this.semesterService.addBlockOut(title, start, end);
                    }

                    // Remove the event by event id
                    if (args[0] == 'remove') {
                        this.semesterService.removeBlockOut(id);
                    }
                }.bind(this),
                // On cancel, do nothing
                function cancel(args) { }
            );
        }
    }

    /**
     * Process selection of time range on calendar.
     * Called by the calendar when user select a range of time on calendar.
     * @param {object} args Object containing all kinds of information about the range selection.
     */
    onTimeRangeSelected(args) {
        const start = args.start.value;
        const end = args.end.value;

        // Clear event title
        // Not clearing event title to reduce user typing
        // $scope.addBlockOutDialog.eventTitle = '';

        this.$mdDialog.show({
            contentElement: '#addBlockOutDialog',
            clickOutsideToClose: true
        }).then(
            // On confirm, add event
            function confirm(args) {
                if (args[0] == 'title') {
                    // Get new title
                    const title = this.addBlockOutDialog.eventTitle;
                    this.semesterService.addBlockOut(title, start, end);
                }
            }.bind(this),
            // On cancel, do nothing
            function cancel(args) { }
        );
    }

    /**
     * Confirm dialog with arguments.
     * This function is called from dialogs to close the dialog.
     * @param {object[]} args Arguments list.
     * @example <md-button class="md-raised" ng-click="dialogConfirm('print')" ng-disabled="true">...</md-button>
     * @see {@link https://material.angularjs.org/latest/api/service/$mdDialog#mddialog-hide-response}
     */
    dialogConfirm(...args) {
        this.$mdDialog.hide(args);
    }

    /**
     * Cancel dialog with arguments.
     * This function is called from dialogs to close the dialog.
     * @param {object[]} args Arguments list.
     * @example <md-button class="md-raised" ng-click="dialogCancel()">Cancel</md-button>
     * @see {@link https://material.angularjs.org/latest/api/service/$mdDialog#mddialog-cancel-response}
     */
    dialogCancel(...args) {
        this.$mdDialog.cancel(args);
    }

    /**
     * Generate and install events.
     * @param {object} event Event object supplied by AngularJS.
     * @param {Section[]} sections List of sections.
     * @param {Section[]} tempSections List of temporary sections.
     * @param {BlockOutEvent[]} blockOuts List of block out events.
     * @listens SemesterService#updateSections
     * @example semesterService.updateSections(event, sections, tempSections, blockOuts);
     * @example $scope.$on('SemesterService#updateSections', this.updateSections.bind(this));
     */
    updateSections(event, sections, tempSections, blockOuts) {
        const events = [];

        for (const section of sections) {
            for (const [i, time] of section.times.entries()) {
                const text = sprintf(
                    '%05d %s%04d,<br>%s,<br>%s',
                    section.crn, section.subject, section.course,
                    section.title,
                    section.instructor
                );

                for (const dayChar of section.days[i]) {
                    const start = this.generateEventTime(dayChar, time[0]);
                    const end = this.generateEventTime(dayChar, time[1]);

                    events.push({
                        text: text,
                        start: start,
                        end: end,
                        type: 'section',
                        crn: section.crn
                    });
                }
            }
        }

        for (const section of tempSections) {
            for (const [i, time] of section.times.entries()) {
                const text = sprintf(
                    '%05d %s%04d,<br>%s,<br>%s',
                    section.crn, section.subject, section.course,
                    section.title,
                    section.instructor
                );

                for (const dayChar of section.days[i]) {
                    const start = this.generateEventTime(dayChar, time[0]);
                    const end = this.generateEventTime(dayChar, time[1]);

                    events.push({
                        text: text,
                        start: start,
                        end: end,
                        type: 'tempSection',
                        crn: section.crn
                    });
                }
            }
        }

        for (const blockOut of blockOuts) {
            events.push({
                text: blockOut.text,
                start: blockOut.start,
                end: blockOut.end,
                id: blockOut.id,
                type: 'blockOut'
            });
        }

        // Do not create a new array, otherwise $scope.events will point to the old array
        // Replace the content of the array instead
        this.events.splice(0, this.events.length, ...events);
        this.sections.splice(0, this.sections.length, ...sections);
        this.$scope.$digest();
    }

    /**
     * Convert the day of the week and time into a string.
     * Usually the string is fed into the calendar.
     * @param {string} dayChar A char representing the day of the week.
     * @param {number} time A number from 0000 to 2359 representing the time of the day.
     * @returns {string}
     */
    generateEventTime(dayChar, time) {
        const dayChars = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
        const dayIndex = dayChars.indexOf(dayChar);

        const day = new Date();
        // Calculate date of Sunday and add weekday offset
        day.setDate(day.getDate() - day.getDay() + dayIndex);
        // Calculate hours by int div 100
        day.setHours(time / 100 | 0);
        // Calculate minute by mod 100
        day.setMinutes(time % 100);
        // Hard code seconds to 0
        day.setSeconds(0);

        const timeString = sprintf(
            '%04d-%02d-%02dT%02d:%02d:%02d',
            day.getFullYear(),
            day.getMonth() + 1,
            day.getDate(),
            day.getHours(),
            day.getMinutes(),
            day.getSeconds()
        );

        return timeString;
    }

    /**
     * Clear selected sections.
     */
    clearSections() {
        this.$mdDialog.show({
            contentElement: '#clearSectionsDialog',
            clickOutsideToClose: true
        }).then(
            // On confirm, do one of the following
            function confirm(args) {
                this.semesterService.clearSections();
            }.bind(this),
            // On cancel, do nothing
            function cancel(args) { }
        );
    }

    /**
     * Clear all block outs.
     */
    clearBlockOuts() {
        this.$mdDialog.show({
            contentElement: '#clearBlockOutsDialog',
            clickOutsideToClose: true
        }).then(
            // On confirm, do one of the following
            function confirm(args) {
                this.semesterService.clearBlockOuts();
            }.bind(this),
            // On cancel, do nothing
            function cancel(args) { }
        );
    }

    /**
     * Generate, preview, and download registration form.
     */
    async generateRegForm() {
        // Get data and url from service
        this.pdfService.generateRegForm(this.sections).then(
            function showDialog(blobPair) {
                const [blob, blobUrl] = blobPair;
                // Set PDF display
                document.getElementById('regFormPdfEmbed').src = blobUrl;

                // Show PDF preview dialog
                this.$mdDialog.show({
                    contentElement: '#generateRegFormDialog',
                    clickOutsideToClose: true
                }).then(
                    function confirm(args) {
                        if (args[0] == 'download') {
                            saveAs(blob, 'RegistrationForm.pdf');
                        }

                        if (args[0] == 'print') {
                            console.log(args);
                        }
                    }.bind(this),
                    function cancel(args) { }
                );
            }.bind(this)
        );
    }
}

app.controller('calendarCardControl', [
    '$rootScope',
    '$scope',
    '$mdDialog',
    'semesterService',
    'dataService',
    'pdfService',
    CalendarCardControl
]);

/**
 * Calendar Card Control Goto Course Event.
 * When user clicks on a section on the calendar, take user to the course to allow the user switch to another section.
 * @event CalendarCardControl#gotoCourse
 * @property {string} subject Subject name.
 * @property {number} course Course number.
 * @example $rootScope.$broadcast('CalendarCardControl#gotoCourse', section.subject, section.course);
 * @example $scope.$on('CalendarCardControl#gotoCourse', (event, subject, course) => { });
 */
