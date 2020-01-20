'use strict';

app.controller('indexControl', function indexControl($rootScope, $scope, $timeout) {
    $scope.isReady = false;

    let nControllers = 0
    $scope.controllersPercent = 0;
    const controllersPending = [];

    let nServices = 0;
    $scope.servicesPercent = 0;
    const servicesPending = [];

    $scope.isJsReady = false;
    $scope.isUiReady = false;

    for (const [, key, args] of app._invokeQueue) {
        const name = args[0];

        if (key == 'register') {
            nControllers++;
            controllersPending.push(name);
        }
        if (key == 'service') {
            nServices++;
            servicesPending.push(name);
        }
    }

    $scope.$on('controllerReady', async function (event, name) {
        const index = controllersPending.findIndex(e => e == name);
        controllersPending.splice(index, 1);
        $scope.controllersPercent = (nControllers - controllersPending.length) / nControllers * 100;
        $scope.isJsReady = (controllersPending.length + servicesPending.length) == 0;
    });

    $scope.$on('serviceReady', async function (event, name) {
        const index = servicesPending.findIndex(e => e == name);
        servicesPending.splice(index, 1);
        $scope.servicesPercent = (nServices - servicesPending.length) / nServices * 100;
        $scope.isJsReady = (controllersPending.length + servicesPending.length) == 0;
    });

    angular.element(async function () {
        // Wait for Firefox to render
        // $timeout(() => $scope.isUiReady = true, 2000);
        $timeout(() => $scope.isUiReady = true, 0);
    });

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});
