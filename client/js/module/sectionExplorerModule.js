'use strict';

/**
 * Section Explorer Module
 * @module SectionExplorer
 */
const app = angular.module('sectionExplorerModule', ['ngMaterial', 'ngMessages']);

// Config theme color
class SectionExplorerTheme {
    constructor($mdThemingProvider) {
        $mdThemingProvider
            .theme('default')
            .primaryPalette('blue', { 'default': '600' });
    }
}
app.config(['$mdThemingProvider', SectionExplorerTheme]);

// Config icons
class SectionExplorerIcon {
    constructor($mdIconProvider) {
        // Info needed to register icons
        // [name, path]
        const icons = [
            ['alert', '../icon/alert.svg'],
            ['arrow:down', '../icon/arrow_down.svg'],
            ['arrow:left', '../icon/arrow_left.svg'],
            ['arrow:up', '../icon/arrow_up.svg'],
            ['arrow:upperLeft', '../icon/arrow_upperLeft.svg'],
            ['arrow:upperRight', '../icon/arrow_upperRight.svg'],
            ['cross', '../icon/cross.svg'],
            ['excel', '../icon/excel.svg'],
            ['reset', '../icon/reset.svg']
        ];

        // Register icon names and icon files
        for (const icon of icons) {
            $mdIconProvider.icon(icon[0], icon[1]);
        }
    }
}
app.config(['$mdIconProvider', SectionExplorerIcon]);
