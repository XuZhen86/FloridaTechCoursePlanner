'use strict';

// Section info card shows detailed info of a section
app.controller('sectionInfoCardControl', function sectionInfoCardControl($rootScope, $scope, $window, $element, dataService) {
    $scope.url = '/client/html/sectionTable/sectionInfoCard.html';

    // Initialize currently showing section to empty
    $scope.section = {};

    // On successful loading data, retrieve the first section
    $scope.$on('dataService.init.success', function success() {
        $scope.section = dataService.getRandomSection();
    });

    // Update shown section upon CRN update
    $scope.$on('sectionTableControl.updateCrn', function updateCrn(event, crn) {
        const section = dataService.getSection(crn);
        // $scope.$apply($scope.section = section);
        $scope.section = section;
    });

    // Take user to PAWS showing that section
    $scope.detailedInfo = function detailedInfo() {
        $window.open(
            // term_in should not be hard-coded
            `https://nssb-p.adm.fit.edu/prod/bwckschd.p_disp_detail_sched?term_in=202001&crn_in=${$scope.section.crn}`,
            '_blank'
        );
    };

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});
