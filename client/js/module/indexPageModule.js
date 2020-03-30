'use strict';

/**
 * Index Page Module
 * @module IndexPage
 */
const app = angular.module('indexPageModule', ['ngMaterial', 'ngMessages']);

// Config theme color
class IndexPageTheme {
    constructor($mdThemingProvider) {
        $mdThemingProvider
            .theme('default')
            .primaryPalette('blue', { 'default': '600' });
    }
}
app.config(['$mdThemingProvider', IndexPageTheme]);

// Config icons
class IndexPageIcon {
    constructor($mdIconProvider) {
        // Info needed to register icons
        // [name, path]
        const icons = [
        ];

        // Register icon names and icon files
        for (const icon of icons) {
            $mdIconProvider.icon(icon[0], icon[1]);
        }
    }
}
app.config(['$mdIconProvider', IndexPageIcon]);
