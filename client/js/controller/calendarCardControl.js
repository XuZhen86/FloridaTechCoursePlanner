'use strict';

app.controller('calendarCardControl', function calendarCardControl($rootScope, $scope, $mdDialog, semesterService, dataService) {
    $scope.url = '/client/html/semesterPlanner/calendarCard.html';

    $scope.config = {
        viewType: "Week",
        cellHeight: 32,
        businessBeginsHour: 8,
        businessEndsHour: 22,
        headerDateFormat: 'dddd',
    };

    // Process resize of any event shown on calendar
    $scope.config.onEventResized = function (args) {
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

    // Process move of any event shown on calendar
    $scope.config.onEventMoved = function (args) {
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

    // Process click of any event shown on a calendar
    $scope.config.onEventClicked = function (args) {
        const type = args.e.data.type;

        // If user clicks a section
        // Take then to the course of this section
        if (type == 'section' || type == 'tempSection') {
            const crn = args.e.data.crn;
            const section = dataService.get('section', crn);
            $rootScope.$broadcast('calendarCardControl.gotoCourse', section.subject, section.course);
        }

        // If user clicks a block out
        // Prompt for a name modification
        if (type == 'blockOut') {
            const id = args.e.data.id;
            const text = args.e.data.text;
            const start = args.e.data.start.value;
            const end = args.e.data.end.value;

            const dialog = $mdDialog.prompt()
                .title('Change block out title')
                .textContent('Change the title of this block out')
                .placeholder('Title')
                .initialValue(text)
                .required(true)
                .ok('Change')
                .cancel('Cancel');
            $mdDialog.show(dialog).then(
                function (title) {
                    semesterService.removeBlockOut(id);
                    semesterService.addBlockOut(title, start, end);
                },
                () => {}
            );
        }
    };

    // Process selection of time range on calendar
    // Ask for a title and add the event to calendar
    $scope.config.onTimeRangeSelected = function (args) {
        const start = args.start.value;
        const end = args.end.value;

        const dialog = $mdDialog.prompt()
            .title('Create block out')
            .textContent('Enter a title of this block out')
            .placeholder('Title')
            .required(true)
            .ok('Create')
            .cancel('Cancel');
        $mdDialog.show(dialog).then(
            function (title) {
                semesterService.addBlockOut(title, start, end);
            },
            () => {}
        );
    }.bind(this);

    // On refreshing sections,
    // Generate events and show them
    $scope.$on('semesterService.updateSections', function (event, sections, tempSections, blockOuts) {
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
        $scope.$apply(function () {
            $scope.events = events;
            $scope.sections = sections;
        });
    }.bind(this));

    // Generate event time string based on current date
    this.generateEventTime = function (dayChar, time) {
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

    // A copy of sections to be shown on Summary
    $scope.sections = [];

    // Columns of Summary
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

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});
