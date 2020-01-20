'use strict';

app.controller('calendarCardControl', function calendarCardControl($rootScope, $scope, semesterService) {
    $scope.url = '/client/html/semesterPlanner/calendarCard.html';

    $scope.config = {
        viewType: "Week",
        cellHeight: 32,
        businessBeginsHour: 8,
        businessEndsHour: 22,
        headerDateFormat: 'dddd',
    };

    // On refreshing sections,
    // Generate events and show them
    $scope.$on('semesterService.updateSections', function (event, sections) {
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
                        end: end
                    });
                }
            }
        }

        // $scope.events = events;
        $scope.$apply($scope.events = events);
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
    }
});
