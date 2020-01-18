'use strict';

// Section info card shows detailed info of a section
app.controller('sectionInfoCardControl', function sectionInfoCardControl($rootScope, $scope, $window, $element, dataService) {
    $scope.url = '/client/html/sectionTable/sectionInfoCard.html';

    // Initialize currently showing section to empty
    $scope.section = {};

    // On successful loading data, retrieve the first section
    $scope.$on('dataService.init.success', function () {
        dataService.get('all-sections').then(
            // Have to use $scope.$apply here,
            // Because it's not running in the same scope as it supposed to
            // If the scope if different, it does not generate a new digest
            // AngularJS does not refresh the UI is the digest is the same
            sections => $scope.$apply($scope.section = sections[0])
        );
    });

    // Update shown section upon CRN update
    $scope.$on('sectionTableControl.updateCrn', function (event, crn) {
        dataService.get('section', crn).then(
            section => $scope.$apply($scope.section = section)
        );
    });

    // Take user to PAWS showing that section
    $scope.detailedInfo = function () {
        $window.open(
            // term_in should not be hard-coded
            `https://nssb-p.adm.fit.edu/prod/bwckschd.p_disp_detail_sched?term_in=202001&crn_in=${$scope.section.crn}`,
            '_blank'
        );
    };

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});
