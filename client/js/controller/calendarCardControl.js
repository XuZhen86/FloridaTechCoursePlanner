app.controller('calendarCardControl', function calendarCardControl($rootScope, $scope) {
    $scope.url = '/client/html/semesterPlanner/calendarCard.html';

    $scope.config = {
        viewType: "Week",
        cellHeight: 40,
        businessBeginsHour: 8,
        businessEndsHour: 22,
        headerDateFormat: 'dddd',
    };

    $scope.events = [
        {
            id: '1',
            start: '2020-01-19T08:00:00',
            end:   '2020-01-19T08:50:00',
            text: 'lol50 Min Class - 800-850haha'
        }, {
            id: '2',
            start: '2020-01-19T09:00:00',
            end:   '2020-01-19T09:50:00',
            text: 'lol50 Min Class - 900-950haha'
        }, {
            id: '3',
            start: '2020-01-19T10:00:00',
            end:   '2020-01-19T11:15:00',
            text: 'lol75 Min Class - 1000-1115haha'
        }, {
            id: '4',
            start: '2020-01-19T11:30:00',
            end:   '2020-01-19T12:45:00',
            text: 'lol75 Min Class - 1130-1245haha'
        }
      ];
});
