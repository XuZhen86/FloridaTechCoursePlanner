'use strict';

// Technical Info Card shows technical info
app.controller('technicalInfoCardControl', function technicalInfoCardControl($rootScope, $scope, dataService, performanceService) {
    $scope.url = '/client/html/sectionTable/technicalInfoCard.html'

    // On successful retrieving the data, show data time stamp
    $scope.$on('dataService.init.success', function () {
        const time = dataService.get('timestamp');
        $scope.timeString = time.toString();
    });

    // Variables related to showing performance analysis
    $scope.performance = {
        isShow: false,
        text: ''
    };
    this.clickCount = 0;

    // Called each time the card is clicked
    $scope.click = function () {
        this.clickCount++;

        // If the card is spam clicked, show performance analysis
        // If it's already showing analysis, update analysis
        if (this.clickCount >= 7) {
            // Ensure output is in a nice format
            $scope.performance.text = performanceService.getAll().map(JSON.stringify).join('\n');
            $scope.performance.isShow = true;
        }
    }.bind(this);

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});
