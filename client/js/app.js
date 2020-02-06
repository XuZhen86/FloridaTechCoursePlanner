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
        ['alert', '/client/icon/alert.svg'],
        ['arrow:left', '/client/icon/arrow_left.svg'],
        ['arrow:right', '/client/icon/arrow_right.svg'],
        ['arrow:upperRight', '/client/icon/arrow_upperRight.svg'],
        ['check', '/client/icon/check.svg'],
        ['cross', '/client/icon/cross.svg'],
        ['download', '/client/icon/download.svg'],
        ['pdf', '/client/icon/pdf.svg'],
        ['plus', '/client/icon/plus.svg'],
        ['printer', '/client/icon/printer.svg']
    ];
    // Register icon names and icon files
    for (const icon of icons) {
        $mdIconProvider.icon(icon[0], icon[1]);
    }
});
