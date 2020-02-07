'use strict';

/**
 * Calendar Card Control controls the calendar.
 * @module calendarCardControl
 * @requires semesterService
 * @requires dataService
 * @requires pdfService
 */
app.controller('calendarCardControl', function calendarCardControl($rootScope, $scope, $mdDialog, semesterService, dataService, pdfService) {
    /**
     * Absolute path to HTML template file. Used by ng-include.
     * @name "$scope.url"
     * @type {string}
     * @constant
     * @see {@link https://docs.angularjs.org/api/ng/directive/ngInclude}
     */
    $scope.url = '../html/semesterPlanner/calendarCard.html';

    // Reserved for development purposes.
    // Uncomment it to switch to Summary tab after loading.
    // So that you do not have to manually switch it every time after it reloads.
    // this.tabIndex = 1;

    /**
     * Configuration object for the calendar.
     * @name "$scope.config"
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
    $scope.config = {
        viewType: 'Week',
        cellHeight: 32,
        businessBeginsHour: 8,
        businessEndsHour: 22,
        headerDateFormat: 'dddd',
    };

    /**
     * Process resizing of any event shown on calendar.
     * Called by the calendar when user resizes a shown event.
     * @function "$scope.config.onEventResized"
     * @param {object} args Object containing all kinds of information about the resizing.
     */
    $scope.config.onEventResized = function onEventResized(args) {
        const type = args.e.data.type;

        // If user tries to resize a section
        // Undo any change by requesting a refresh
        if (type == 'section' || type == 'tempSection') {
            semesterService.broadcastSections();
        }

        // If user tries to resize a block out
        // Delete the original and create a new one
        if (type == 'blockOut') {
            const blockOut = args.e.data;
            semesterService.removeBlockOut(blockOut.id);
            semesterService.addBlockOut(blockOut.text, blockOut.start, blockOut.end);
        }
    }.bind(this);

    /**
     * Process moving of any event shown on calendar.
     * Called by the calendar when user drags and moves a shown event.
     * @function "$scope.config.onEventMoved"
     * @param {object} args Object containing all kinds of information about the moving.
     */
    $scope.config.onEventMoved = function onEventMoved(args) {
        const type = args.e.data.type;

        // If user tries to move a section
        // Undo any change by requesting a refresh
        if (type == 'section' || type == 'tempSection') {
            semesterService.broadcastSections();
        }

        // If user tries to move a block out
        // Delete the original and create a new one
        if (type == 'blockOut') {
            const blockOut = args.e.data;
            semesterService.removeBlockOut(blockOut.id);
            semesterService.addBlockOut(blockOut.text, blockOut.start, blockOut.end);
        }
    }.bind(this);

    /**
     * Supportive object containing information for the change block out dialog.
     * @name "$scope.changeBlockOutDialog"
     * @type {object}
     * @property {string} eventTitle Title of the event. It is tied to user input.
     */
    $scope.changeBlockOutDialog = {
        eventTitle: ''
    };

    /**
     * Process clicking of any event shown on a calendar.
     * Called by the calendar when user clicks a shown event.
     * @function "$scope.config.onEventClicked"
     * @param {object} args Object containing all kinds of information about the clicking.
     */
    $scope.config.onEventClicked = function onEventClicked(args) {
        const type = args.e.data.type;

        // If user clicks a section
        // Take then to the course of this section
        if (type == 'section' || type == 'tempSection') {
            const crn = args.e.data.crn;
            const section = dataService.getSection(crn);
            $rootScope.$broadcast('calendarCardControl#gotoCourse', section.subject, section.course);
        }

        // If user clicks a block out
        // Prompt for a name modification
        if (type == 'blockOut') {
            const id = args.e.data.id;
            const text = args.e.data.text;
            const start = args.e.data.start.value;
            const end = args.e.data.end.value;

            // Initialize content of text box
            $scope.changeBlockOutDialog.eventTitle = text;

            $mdDialog.show({
                contentElement: '#changeBlockOutDialog',
                clickOutsideToClose: true
            }).then(
                // On confirm, do one of the following
                function confirm(args) {
                    // Change title of the event
                    // Remove the event then add a same one with different title
                    if (args[0] == 'title') {
                        // Get new title
                        const title = $scope.changeBlockOutDialog.eventTitle;
                        semesterService.removeBlockOut(id);
                        semesterService.addBlockOut(title, start, end);
                    }

                    // Remove the event by event id
                    if (args[0] == 'remove') {
                        semesterService.removeBlockOut(id);
                    }
                },
                // On cancel, do nothing
                function cancel() { }
            );
        }
    };

    /**
     * Supportive object containing information for the add block out dialog.
     * @name "$scope.addBlockOutDialog"
     * @type {object}
     * @property {string} eventTitle Title of the event. It is tied to user input.
     */
    $scope.addBlockOutDialog = {
        // colors: Object.keys($mdColorPalette),
        // color: 'light-blue',
        eventTitle: ''
    };

    /**
     * Process selection of time range on calendar.
     * Called by the calendar when user select a range of time on calendar.
     * @function "$scope.config.onTimeRangeSelected"
     * @param {object} args Object containing all kinds of information about the range selection.
     */
    $scope.config.onTimeRangeSelected = function onTimeRangeSelected(args) {
        const start = args.start.value;
        const end = args.end.value;

        // Clear event title
        // Not clearing event title to reduce user typing
        // $scope.addBlockOutDialog.eventTitle = '';

        $mdDialog.show({
            contentElement: '#addBlockOutDialog',
            clickOutsideToClose: true
        }).then(
            // On confirm, add event
            function confirm(args) {
                if (args[0] == 'title') {
                    // Get new title
                    const title = $scope.addBlockOutDialog.eventTitle;
                    semesterService.addBlockOut(title, start, end);
                }
            },
            // On cancel, do nothing
            function cancel() { }
        );
    }.bind(this);

    /**
     * Confirm dialog with arguments.
     * This function is called from dialogs to close the dialog.
     * @function "$scope.dialogConfirm"
     * @param {object[]} args Arguments list.
     * @example <md-button class="md-raised" ng-click="dialogConfirm('print')" ng-disabled="true">...</md-button>
     * @see {@link https://material.angularjs.org/latest/api/service/$mdDialog#mddialog-hide-response}
     */
    $scope.dialogConfirm = function dialogConfirm(...args) {
        $mdDialog.hide(args);
    };

    /**
     * Cancel dialog with arguments.
     * This function is called from dialogs to close the dialog.
     * @function "$scope.dialogCancel"
     * @param {object[]} args Arguments list.
     * @example <md-button class="md-raised" ng-click="dialogCancel()">Cancel</md-button>
     * @see {@link https://material.angularjs.org/latest/api/service/$mdDialog#mddialog-cancel-response}
     */
    $scope.dialogCancel = function dialogCancel(...args) {
        $mdDialog.cancel(args);
    };

    /**
     * Generate and install events.
     * @param {object} event Event object supplied by AngularJS.
     * @param {Section[]} sections List of sections.
     * @param {Section[]} tempSections List of temporary sections.
     * @param {BlockOutEvent[]} blockOuts List of block out events.
     * @listens module:semesterService#updateSections
     * @example semesterService.updateSections(event, sections, tempSections, blockOuts);
     * @example $scope.$on('semesterService#updateSections', this.updateSections.bind(this));
     */
    this.updateSections = function updateSections(event, sections, tempSections, blockOuts) {
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

        // $scope.events = events;
        $scope.$apply(function apply() {
            $scope.events = events;
            $scope.sections = sections;
        });
    };

    // On refreshing sections, generate events and show them
    $scope.$on('semesterService#updateSections', this.updateSections.bind(this));

    /**
     * Convert the day of the week and time into a string.
     * Usually the string is fed into the calendar.
     * @param {string} dayChar A char representing the day of the week.
     * @param {number} time A number from 0000 to 2359 representing the time of the day.
     * @returns {string}
     */
    this.generateEventTime = function generateEventTime(dayChar, time) {
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
    };

    /**
     * List of sections shown in Summary table.
     * @name "$scope.sections"
     * @type {Section[]}
     */
    $scope.sections = [];

    /**
     * Column titles for Summary table.
     * @name "$scope.columns"
     * @type {string[]}
     */
    $scope.columns = [
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
     * Clear selected sections.
     * @function "$scope.clearSections"
     */
    $scope.clearSections = function clearSections() {
        $mdDialog.show({
            contentElement: '#clearSectionsDialog',
            clickOutsideToClose: true
        }).then(
            // On confirm, do one of the following
            function confirm(args) {
                semesterService.clearSections();
            },
            // On cancel, do nothing
            function cancel(args) { }
        );
    };

    /**
     * Clear all block outs.
     * @function "$scope.clearBlockOuts"
     */
    $scope.clearBlockOuts = function clearBlockOuts() {
        $mdDialog.show({
            contentElement: '#clearBlockOutsDialog',
            clickOutsideToClose: true
        }).then(
            // On confirm, do one of the following
            function confirm(args) {
                semesterService.clearBlockOuts();
            },
            // On cancel, do nothing
            function cancel(args) { }
        );
    };

    /**
     * Generate, preview, and download registration form.
     * @function "$scope.generateRegForm"
     * @async
     */
    $scope.generateRegForm = async function generateRegForm() {
        // Get data and url from service
        pdfService.generateRegForm($scope.sections).then(
            function showDialog(blobPair) {
                const [blob, blobUrl] = blobPair;
                // Set PDF display
                document.getElementById('regFormPdfEmbed').src = blobUrl;

                // Show PDF preview dialog
                $mdDialog.show({
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
                    },
                    function cancel(args) { }
                );
            }
        );
    };

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});

/**
 * Calendar Card Control Goto Course Event.
 * When user clicks on a section on the calendar, take user to the course to allow the user switch to another section.
 * @event module:calendarCardControl#gotoCourse
 * @property {string} subject Subject name.
 * @property {number} course Course number.
 * @example $rootScope.$broadcast('calendarCardControl#gotoCourse', section.subject, section.course);
 * @example $scope.$on('calendarCardControl#gotoCourse', (event, subject, course) => { });
 */
