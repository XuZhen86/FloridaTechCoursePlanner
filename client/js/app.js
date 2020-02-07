'use strict';

/**
 * Miscellaneous configurations and definitions.
 * @module app
 */
const app = angular.module('app', ['ngMaterial', 'ngMessages', 'daypilot', 'sprintf']);

// Config theme color
app.config(function ($mdThemingProvider) {
    $mdThemingProvider
        .theme('default')
        .primaryPalette('blue', { 'default': '600' });
});

// Config icons
app.config(function ($mdIconProvider) {
    // Info needed to register icons
    // [name, path]
    const icons = [
        ['alert', '../icon/alert.svg'],
        ['arrow:left', '../icon/arrow_left.svg'],
        ['arrow:right', '../icon/arrow_right.svg'],
        ['arrow:upperRight', '../icon/arrow_upperRight.svg'],
        ['check', '../icon/check.svg'],
        ['cross', '../icon/cross.svg'],
        ['download', '../icon/download.svg'],
        ['pdf', '../icon/pdf.svg'],
        ['plus', '../icon/plus.svg'],
        ['printer', '../icon/printer.svg']
    ];
    // Register icon names and icon files
    for (const icon of icons) {
        $mdIconProvider.icon(icon[0], icon[1]);
    }
});
