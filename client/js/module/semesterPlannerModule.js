'use strict';

/**
 * Semester Planner Module
 * @module SemesterPlanner
 */
const app = angular.module('semesterPlannerModule', ['ngMaterial', 'ngMessages', 'daypilot', 'sprintf']);

// Config theme color
class SemesterPlannerTheme {
    constructor($mdThemingProvider) {
        $mdThemingProvider
            .theme('default')
            .primaryPalette('blue', { 'default': '600' });
    }
}
app.config(['$mdThemingProvider', SemesterPlannerTheme]);

// Config icons
class SemesterPlannerIcon {
    constructor($mdIconProvider) {
        // Info needed to register icons
        // [name, path]
        const icons = [
            ['alert', '../icon/alert.svg'],
            ['arrow:left', '../icon/arrow_left.svg'],
            ['arrow:right', '../icon/arrow_right.svg'],
            ['arrow:upperLeft', '../icon/arrow_upperLeft.svg'],
            ['arrow:upperRight', '../icon/arrow_upperRight.svg'],
            ['check', '../icon/check.svg'],
            ['cross', '../icon/cross.svg'],
            ['dot', '../icon/dot.svg'],
            ['download', '../icon/download.svg'],
            ['magnifier', '../icon/magnifier.svg'],
            ['pdf', '../icon/pdf.svg'],
            ['reset', '../icon/reset.svg']
        ];

        // Register icon names and icon files
        for (const icon of icons) {
            $mdIconProvider.icon(icon[0], icon[1]);
        }
    }
}
app.config(['$mdIconProvider', SemesterPlannerIcon]);
