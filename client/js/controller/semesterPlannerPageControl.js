'use strict';

/**
 * Semester Planner Page Control controls miscellaneous items on the page.
 * @class
 * @example
app.controller('semesterPlannerPageControl', [
    '$rootScope',
    '$scope',
    '$mdDialog',
    SemesterPlannerPageControl
]);
 */
class SemesterPlannerPageControl {
    /**
     * @param {object} $rootScope {@link https://docs.angularjs.org/api/ng/service/$rootScope}
     * @param {object} $scope {@link https://docs.angularjs.org/guide/scope}
     * @param {object} $mdDialog {@link https://material.angularjs.org/latest/api/service/$mdDialog}
     */
    constructor($rootScope, $scope, $mdDialog) {
        this.$rootScope = $rootScope;
        this.$scope = $scope;
        this.$mdDialog = $mdDialog;

        /**
         * Wrapper object of attributes used in the help button.
         * @type {object}
         * @property {boolean} isOpen Is the help menu open.
         */
        this.helpButton = {
            isOpen: false
        };

        /**
         * List of help options.
         * @type {HelpBundle[]}
         * @constant
         */
        this.helps = [
            {
                key: 'SemesterPlannerAddBlockOutEvent',
                question: 'How to add a block out event?',
                videoPath: '../video/SemesterPlannerAddBlockOutEvent.mov'
            }, {
                key: 'SemesterPlannerAddSection',
                question: 'How to add a section?',
                videoPath: '../video/SemesterPlannerAddSection.mov'
            }, {
                key: 'SemesterPlannerClearSelections',
                question: 'How to clear sections and block out events?',
                videoPath: '../video/SemesterPlannerClearSelections.mov'
            }, {
                key: 'SemesterPlannerGenerateForm',
                question: 'How to generate Registration Form PDF?',
                videoPath: '../video/SemesterPlannerGenerateForm.mov'
            }, {
                key: 'SemesterPlannerQuickSwitchCourse',
                question: 'How to quick switch to course?',
                videoPath: '../video/SemesterPlannerQuickSwitchCourse.mov'
            }, {
                key: 'SemesterPlannerSearch',
                question: 'How to search something?',
                videoPath: '../video/SemesterPlannerSearch.mov'
            }, {
                key: 'SemesterPlannerSwitchSection',
                question: 'How to switch to another section within a course?',
                videoPath: '../video/SemesterPlannerSwitchSection.mov'
            }, {
                key: 'SemesterPlannerUnselectSection',
                question: 'How to remove a section?',
                videoPath: '../video/SemesterPlannerUnselectSection.mov'
            }, {
                key: 'SemesterPlannerViewInfo',
                question: 'How to view detailed info of a course and a section?',
                videoPath: '../video/SemesterPlannerViewInfo.mov'
            }
        ];

        /**
         * Wrapper object for attributes used in help dialog.
         * @type {object}
         * @property {string} question The question the user might be asking.
         * @property {string} videoPath The relative path to get the video file.
         */
        this.helpDialog = {
            question: '',
            videoPath: ''
        };

        // Expose variables to HTML
        $scope.helpButton = this.helpButton;
        $scope.openMenu = this.openMenu.bind(this);
        $scope.helps = this.helps;
        $scope.showHelp = this.showHelp.bind(this);
        $scope.helpDialog = this.helpDialog;
        $scope.dialogCancel = this.dialogCancel.bind(this);
        $scope.dialogConfirm = this.dialogConfirm.bind(this);
    }

    /**
     * Generic handler of open menu event.
     * Required by AngularJS.
     * @param {object} $mdMenu
     * @param {object} event
     * @see {@link https://material.angularjs.org/latest/demo/menu}
     */
    openMenu($mdMenu, event) {
        $mdMenu.open(event);
    }

    /**
     * Show user the help video.
     * @param {string} key The key of the video entry. This will be used to find video file.
     */
    showHelp(key) {
        const help = this.helps.find(help => help.key == key);
        this.helpDialog.question = help.question;
        this.helpDialog.videoPath = help.videoPath;

        // Refresh video source. Otherwise it keeps playing the same video
        document.getElementById('helpVideo').load();

        this.$mdDialog.show({
            contentElement: '#helpDialog',
            clickOutsideToClose: true
        }).then(
            // Confirm. Do nothing.
            function confirm(args) { },
            // Cancel. Do nothing.
            function cancel(args) { }
        );
    }

    /**
     * Confirm dialog with arguments.
     * This function is called from dialogs to close the dialog.
     * @param {object[]} args Arguments list.
     * @example <md-button class="md-raised" ng-click="dialogConfirm('print')" ng-disabled="true">...</md-button>
     * @see {@link https://material.angularjs.org/latest/api/service/$mdDialog#mddialog-hide-response}
     */
    dialogConfirm(...args) {
        this.$mdDialog.hide(args);
    }

    /**
     * Cancel dialog with arguments.
     * This function is called from dialogs to close the dialog.
     * @param {object[]} args Arguments list.
     * @example <md-button class="md-raised" ng-click="dialogCancel()">Cancel</md-button>
     * @see {@link https://material.angularjs.org/latest/api/service/$mdDialog#mddialog-cancel-response}
     */
    dialogCancel(...args) {
        this.$mdDialog.cancel(args);
    }
}

app.controller('semesterPlannerPageControl', [
    '$rootScope',
    '$scope',
    '$mdDialog',
    SemesterPlannerPageControl
]);
