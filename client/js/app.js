'use strict';

const app = angular.module('app', ['ngMaterial', 'ngMessages']);

app.config(
    // Config theme color
    function ($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('blue', {'default': '600'});
    }
);
