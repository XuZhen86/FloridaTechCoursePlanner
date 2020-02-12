'use strict';

/**
 * Course Selector Card Control controls the course selector.
 * @class
 * @example
app.controller('courseSelectorCardControl', [
    '$rootScope',
    '$scope',
    '$mdDialog',
    '$mdToast',
    'dataService',
    'semesterService',
    CourseSelectorCardControl
]);
 */
class CourseSelectorCardControl {
    /**
     * @param {object} $rootScope {@link https://docs.angularjs.org/api/ng/service/$rootScope}
     * @param {object} $scope {@link https://docs.angularjs.org/guide/scope}
     * @param {object} $mdDialog {@link https://material.angularjs.org/latest/api/service/$mdDialog}
     * @param {object} $mdToast {@link https://material.angularjs.org/latest/api/service/$mdToast}
     * @param {DataService} dataService
     * @param {SemesterService} semesterService
     */
    constructor($rootScope, $scope, $mdDialog, $mdToast, dataService, semesterService) {
        this.$rootScope = $rootScope;
        this.$scope = $scope;
        this.$mdDialog = $mdDialog;
        this.$mdToast = $mdToast;
        this.dataService = dataService;
        this.semesterService = semesterService;

        /**
         * Absolute path to HTML template file. Used by ng-include.
         * @type {string}
         * @constant
         * @see {@link https://docs.angularjs.org/api/ng/directive/ngInclude}
         */
        this.htmlTemplate = '../html/semesterPlanner/courseSelectorCard.html';

        /**
         * Tab index of currently shown tab.
         * There is a bug in AngularJS that tabIndex must be a controller variable.
         * @type {number}
         */
        this.tabIndex = 1;

        /**
         * List of subjects.
         * @type {Subject[]}
         */
        this.subjects = [];

        /**
         * List of courses.
         * @type {Course[]}
         */
        this.courses = [];

        /**
         * List of sections.
         * @type {Section[]}
         */
        this.sections = [];

        /**
         * Supportive object containing information for course info dialog.
         * @type {object}
         * @property {Course} course Course object.
         * @property {Section[]} sections List of sections.
         */
        this.courseInfoDialog = {
            course: {},
            sections: []
        };

        /**
         * Supportive object containing information for section info dialog.
         * @type {object}
         * @property {Section} section Section object.
         */
        this.sectionInfoDialog = {
            section: {}
        };

        /**
         * Supportive object containing strings to be shown on toolbar.
         * @type {object}
         * @property {string} button Button text.
         * @property {string} title Title text.
         * @property {string} subject Subject text.
         * @property {string} course Course text.
         */
        this.toolbar = {
            button: '',
            title: '',
            subject: '',
            course: ''
        };

        // Variable related to search feature
        // Use set() if AngularJS does not refresh UI after changing the variable
        this.search = {
            input: '',
            help: '',
            example: '',
            sections: [],
            nShown: 20,
            nShownDelta: 20,
            set: function set(key, value) {
                // Set sections also resets nShown
                if (key == 'sections') {
                    $scope.search.nShown = $scope.search.nShownDelta;
                }
                $scope.search[key] = value;
                // $scope.$digest();
            },
            showMore: function showMore() {
                $scope.search.nShown += $scope.search.nShownDelta;
                $scope.search.nShown = Math.min($scope.search.sections.length, $scope.search.nShown);
            },
            clear: function clear() {
                $scope.search.input = '';
            }
        };

        // Show Subject tab after downloading data.
        $scope.$on('DataService#initSuccess', this.showInitialTab.bind(this));

        // Called when calendar requests to show sections of a course
        $scope.$on('CalendarCardControl#gotoCourse', this.gotoCourse.bind(this));

        // Refresh styles when selected sections change.
        $scope.$on('SemesterService#updateSections', this.refreshStyles.bind(this));

        // Expose variables to HTML
        $scope.courseClick = this.courseClick.bind(this);
        $scope.courseIconClick = this.courseIconClick.bind(this);
        $scope.courseInfoDialog = this.courseInfoDialog;
        $scope.courses = this.courses;
        $scope.dialogCancel = this.dialogCancel.bind(this);
        $scope.dialogConfirm = this.dialogConfirm.bind(this);
        $scope.htmlTemplate = this.htmlTemplate;
        $scope.mouseEnter = this.mouseEnter.bind(this);
        $scope.mouseLeave = this.mouseLeave.bind(this);
        $scope.search = this.search;
        $scope.searchInputChange = this.searchInputChange.bind(this);
        $scope.sectionClick = this.sectionClick.bind(this);
        $scope.sectionIconClick = this.sectionIconClick.bind(this);
        $scope.sectionInfoDialog = this.sectionInfoDialog;
        $scope.sections = this.sections;
        $scope.setToolbar = this.setToolbar.bind(this);
        $scope.showSearchedCourse = this.showSearchedCourse.bind(this);
        $scope.subjectClick = this.subjectClick.bind(this);
        $scope.subjects = this.subjects;
        $scope.toolbar = this.toolbar;
        $scope.toolbarClick = this.toolbarClick.bind(this);

        $rootScope.$broadcast('controllerReady', this.constructor.name);
    }

    /**
     * Refresh all styles when selected sections changes.
     * @param {object} event Event object supplied by AngularJS.
     * @param {Section[]} sections List of selected sections.
     * @param {Section[]} tempSections List of temporarily selected sections.
     * @param {BlockOutEvent[]} blockOuts Block out events.
     * @listens SemesterService#updateSections
     * @example $scope.$on('SemesterService#updateSections', this.refreshStyles.bind(this));
     */
    refreshStyles(event, sections, tempSections, blockOuts) {
        this.refreshCourseStyles(this.courses);
        this.refreshSectionStyles(this.sections);
    }

    /**
     * Switch to Subjects tab after successful downloading the data.
     * @param {object} event Event object supplied by AngularJS.
     * @example courseSelectorCardControl.showInitialTab(event);
     * @example $scope.$on('DataService#initSuccess', this.showInitialTab.bind(this));
     * @listens DataService#initSuccess
     */
    showInitialTab(event) {
        this.showSubjects();
    }

    /**
     * Show a course by simulating user clicks.
     * Used when jump to course without clicking.
     * @param {object} event Event object supplied by AngularJS.
     * @param {string} subject Subject name.
     * @param {number} course Course number.
     * @example courseSelectorCardControl.gotoCourse('CSE', 1001);
     * @example $scope.$on('CalendarCardControl#gotoCourse', this.gotoCourse.bind(this));
     * @listens CalendarCardControl#gotoCourse
     */
    gotoCourse(event, subject, course) {
        // Simulate a click on UI
        this.subjectClick({ subject: subject });
        this.courseClick({ subject: subject, course: course });
        this.setToolbar(3);
        this.$scope.$digest();
    }

    // Called when course selector's search requests to show sections of a course
    showSearchedCourse(course) {
        const subject = this.dataService.getSubject(course.subject).subject;
        // Simulate a click on UI
        this.subjectClick({ subject: subject });
        this.courseClick({ subject: subject, course: course.course });
        this.setToolbar(3);
        this.$scope.$digest();
    }

    /**
     * Click handler for subjects.
     * Switch to courses tab and refresh course styles.
     * @param {Subject} subject Subject object, directly supplied by HTML.
     * @example <md-list-item class="md-2-line" ng-repeat="subject in subjects" ng-click="subjectClick(subject)" ng-style="">...</md-list-item>
     */
    subjectClick(subject) {
        this.showCourses(subject.subject);
    }

    /**
     * Click handler for courses.
     * Switch to sections tab and refresh section styles.
     * @param {Course} course Course object, directly supplied by HTML.
     * @example <md-list-item class="md-2-line" ng-repeat="course in courses" ng-click="courseClick(course)" ng-style="course.style">...</md-list-item>
     */
    courseClick(course) {
        this.showSections(course.subject, course.course);
    }

    /**
     * Click handler for sections.
     * Decide to either add, remove, switch sections.
     * @param {Section} section Section object, directly supplied by HTML.
     * @example <md-list-item class="md-2-line" ng-repeat="section in sections" ng-click="sectionClick(section)" ng-style="section.style" ng-mouseenter="mouseEnter(section)" ng-mouseleave="mouseLeave(section)">...</md-list-item>
     */
    sectionClick(section) {
        const crn = section.crn;

        // If this section is added, remove it
        if (this.semesterService.isSectionAdded(crn)) {
            this.semesterService.removeSection(crn);
            this.$mdToast.showSimple(`Removed section ${crn}`);
            // this.refreshSectionStyles(this.sections);
            return;
        }

        const subject = section.subject;
        const course = section.course;
        const isCourseAdded = this.semesterService.isCourseAdded(subject, course);
        const isSectionFull = section.cap[0] >= section.cap[1];

        // If another section within the same course is added && this section is not full,
        // Then switch to this section
        if (isCourseAdded && !isSectionFull) {
            // Remove all sections of this course
            this.semesterService.removeCourse(subject, course);
            this.semesterService.addSection(crn);
            this.$mdToast.showSimple(`Switched to section ${crn}`);
            // this.refreshSectionStyles(this.sections);
            return;
        }

        // If another section within the same course is added, && this section is full,
        // Then ask user first and switch to this course
        if (isCourseAdded && isSectionFull) {
            this.$mdDialog.show({
                contentElement: '#fullSectionSwitchDialog',
                clickOutsideToClose: true
            }).then(
                // Confirm. Add the section.
                function confirm(args) {
                    this.semesterService.removeCourse(subject, course);
                    this.semesterService.addSection(crn);
                    this.$mdToast.showSimple(`Switched to section ${crn}`);
                    // this.refreshSectionStyles(this.sections);
                }.bind(this),
                // Cancel. Do nothing.
                function cancel(args) { }
            );
            return;
        }

        // If this section conflicts with 1 or more added sections, ask user
        if (this.semesterService.isSectionConflict(crn)) {
            this.$mdDialog.show({
                contentElement: '#conflictSectionDialog',
                clickOutsideToClose: true
            }).then(
                // Confirm. Add the section.
                function confirm(args) {
                    this.semesterService.addSection(crn);
                    this.$mdToast.showSimple(`Added section ${crn}`);
                    // this.refreshSectionStyles(this.sections);
                }.bind(this),
                // Cancel. Do nothing.
                function cancel(args) { }
            );

            return;
        }

        // If this section is full, ask user
        // TODO: Add the link to form
        if (isSectionFull) {
            this.$mdDialog.show({
                contentElement: '#fullSectionDialog',
                clickOutsideToClose: true
            }).then(
                // Confirm. Add the section.
                function confirm(args) {
                    this.semesterService.addSection(crn);
                    this.$mdToast.showSimple(`Added section ${crn}`);
                    // this.refreshSectionStyles(this.sections);
                }.bind(this),
                // Cancel. Do nothing.
                function cancel(args) { }
            );

            return;
        }

        // Otherwise, add the section
        this.semesterService.addSection(crn);
        this.$mdToast.showSimple(`Added section ${crn}`);
        // this.refreshSectionStyles(this.sections);
    }

    /**
     * Click handler for toolbar back button.
     * Decide to return to previous tab or to search tab.
     * @example <md-button class="md-raised" ng-click="toolbarClick()">...</md-button>
     */
    toolbarClick() {
        if (this.tabIndex == 0) {
            this.tabIndex = 1;
        } else {
            this.tabIndex--;
        }
    }

    /**
     * Handle click of a course icon.
     * Show course info dialog.
     * @param {Course} course The course to be shown.
     * @example <md-button class="md-raised md-icon-button" ng-click="courseIconClick(course)" aria-label="label">...</md-button>
     */
    courseIconClick(course) {
        this.courseInfoDialog.course = course;
        this.courseInfoDialog.sections = this.dataService.getSections(course.subject, course.course);
        this.$mdDialog.show({
            contentElement: '#courseInfoDialog',
            clickOutsideToClose: true
        }).then(
            function confirm(args) {
                if (args[0] == 'showSections') {
                    const course = this.courseInfoDialog.course;
                    this.showSections(course.subject, course.course);
                }
            }.bind(this),
            function cancel(args) { }
        );
    }

    /**
     * Handle click of a section icon.
     * @param {Section} section The section to be shown.
     * @example <md-button class="md-raised md-icon-button" ng-click="sectionIconClick(section)" aria-label="label">...</md-button>
     */
    sectionIconClick(section) {
        this.sectionInfoDialog.section = section;
        this.$mdDialog.show({
            contentElement: '#sectionInfoDialog',
            clickOutsideToClose: true
        }).then(
            function confirm(args) {
                this.click('section', section);
            }.bind(this),
            function cancel(args) {
                console.log('cancel');
            }
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

    /**
     * Give style to courses.
     * @param {Course} course The course to be styled.
     * @returns {object} The object containing style information. This object is usually fed into ng-style.
     * @see {@link https://docs.angularjs.org/api/ng/directive/ngStyle}
     * @example const style = courseSelectorCardControl.courseStyle(course);
     */
    courseStyle(course) {
        const green = '#dff0d8';
        const red = '#f2dede';
        const yellow = '#fcf8e3';

        // If this course has a section that is in the list
        if (this.semesterService.isCourseAdded(course.subject, course.course)) {
            return {
                'background-color': green,
                'status': 'green'
            };
        }

        // If all of this course's section conflict with sections in the list
        if (this.semesterService.isCourseConflict(course.subject, course.course)) {
            return {
                'background-color': red,
                'status': 'red'
            };
        }

        // If all of this course's sections are full
        const sections = this.dataService.getSections(course.subject, course.course);
        const isAllFull = sections.every(section => section.cap[0] >= section.cap[1]);
        if (isAllFull) {
            return {
                'background-color': yellow,
                'status': 'yellow'
            };
        }

        return {
            'status': 'none'
        };
    }

    /**
     * Generate style for list of courses.
     * @param {Course[]} courses List of courses.
     * @example courseSelectorCardControl.refreshCourseStyles(courses);
     */
    refreshCourseStyles(courses) {
        for (const course of courses) {
            course.style = this.courseStyle(course);
        }
    }

    /**
     * Give style to sections.
     * @param {Section} section The section to be styled.
     * @returns {object} The object containing style information. This object is usually fed into ng-style.
     * @see {@link https://docs.angularjs.org/api/ng/directive/ngStyle}
     * @example courseSelectorCardControl.sectionStyle(section);
     */
    sectionStyle(section) {
        const green = '#dff0d8';
        const red = '#f2dede';
        const yellow = '#fcf8e3';

        const crn = section.crn;

        // If this section is already added to the list
        if (this.semesterService.isSectionAdded(crn)) {
            return {
                'background-color': green,
                'status': 'green'
            };
        }

        // If this section conflicts with any of the added sections
        if (this.semesterService.isSectionConflict(crn)) {
            return {
                'background-color': red,
                'status': 'red'
            };
        }

        // If this section is full
        if (section.cap[0] >= section.cap[1]) {
            return {
                'background-color': yellow,
                'status': 'yellow'
            };
        }

        return {
            'status': 'none'
        };
    }

    /**
     * Generate style for list of sections.
     * @param {Section[]} sections List of sections.
     * @example courseSelectorCardControl.refreshSectionStyles(sections);
     */
    refreshSectionStyles(sections) {
        for (const section of sections) {
            section.style = this.sectionStyle(section);
        }
    }

    /**
     * Mouse hover enters section.
     * @param {Section} section
     */
    mouseEnter(section) {
        const crn = section.crn;
        this.semesterService.addTempSection(crn);
    }

    /**
     * Mouse hover leaves section.
     * @param {Section} section
     */
    mouseLeave(section) {
        const crn = section.crn;
        this.semesterService.removeTempSection(crn);
    }

    /**
     * Switch to subjects tab.
     * @example courseSelectorCardControl.showSubjects();
     */
    showSubjects() {
        // Refine to only contain essential data
        const subjects = this.dataService.getSubjects().map(
            function refine(subject) {
                return {
                    subject: subject.subject,
                    title: subject.title,
                    nCourses: subject.courseIdxs.length
                };
            }
        );

        this.subjects.splice(0, this.subjects.length, ...subjects);

        // Switch to subject tab
        this.tabIndex = 1;

        // Set toolbar text
        // Switching to a new tab auto triggers this function
        // $scope.setToolbar(1);
    }

    /**
     * Switch to courses tab, show courses under subject, and refresh course styles.
     * @param {string} subject Subject name.
     * @example courseSelectorCardControl.showCourses('CSE');
     */
    showCourses(subject) {
        // If subject is not provided,
        // Get the subject that's already showing
        if (subject == undefined) {
            subject = this.toolbar.subject;
        }

        // Refine to only contain essential data
        const courses = this.dataService.getCourses(subject).map(
            function refine(course) {
                return {
                    subject: course.subject,
                    course: course.course,
                    cr: course.cr,
                    tags: course.tags,
                    title: course.title,
                    nSections: course.sectionIdxs.length,
                    description: course.description,
                    note: course.note,
                    style: {}
                };
            }
        );

        this.courses.splice(0, this.courses.length, ...courses);

        // This is done in $scope.setToolbar()
        // this.refreshCourseStyles($scope.courses);

        // Switch to course tab
        this.tabIndex = 2;

        // Set toolbar text
        this.toolbar.subject = subject;

        // Switching to a new tab auto triggers this function
        // $scope.setToolbar(2);
    }

    /**
     * Switch to sections tab, show section under course, and refresh section styles.
     * @param {string} subject Subject name.
     * @param {number} course Course number.
     * @example courseSelectorCardControl.showSections('CSE', 1001);
     */
    showSections(subject, course) {
        // If subject or course number is not provided,
        // Get the subject and course number that's already showing
        if (subject == undefined || course == undefined) {
            subject = this.toolbar.subject;
            course = this.toolbar.course;
        }

        // Refine to only contain essential data
        const sections = this.dataService.getSections(subject, course).map(
            function refine(section) {
                section.style = {};
                return section;
            }
        );

        this.sections.splice(0, this.sections.length, ...sections);

        // This is done in $scope.setToolbar()
        // this.refreshSectionStyles($scope.sections);

        // Switch to section tab
        this.tabIndex = 3;

        // Set toolbar text
        this.toolbar.subject = subject;
        this.toolbar.course = course;

        // Switching to a new tab auto triggers this function
        // $scope.setToolbar(3);
    }

    /**
     * Change toolbar text according to tab index.
     * @param {number} tabIndex Which tab to switch to.
     * @example <md-tab label="Search" md-on-select="setToolbar(0)">...</md-tab>
     */
    setToolbar(tabIndex) {
        // For search, also randomly select a section to show as example
        if (tabIndex == 0) {
            this.toolbar.button = 'Back';
            this.toolbar.title = 'Search sections';

            // Randomly select a section with instructor name
            const section = this.dataService.getRandomSection(
                section => section.instructor.length != 0
            );

            this.search.example = `Example: ${section.crn} or ${section.subject} or ${section.subject}${section.course} or ${section.instructor}`;
            this.search.help = this.search.example;
        }

        if (tabIndex == 1) {
            this.toolbar.button = 'Search';
            this.toolbar.title = 'Subjects';
        }

        if (tabIndex == 2) {
            const subject = this.toolbar.subject;
            const subjectTitle = this.dataService.getSubject(subject).title;
            this.toolbar.button = 'Subject';
            this.toolbar.title = `${subject} - ${subjectTitle}`;
            this.refreshCourseStyles(this.courses);
        }

        if (tabIndex == 3) {
            const subject = this.toolbar.subject;
            const course = this.toolbar.course;
            const courseTitle = this.dataService.getCourse(subject, course).title;
            this.toolbar.button = 'Course';
            this.toolbar.title = `${subject} ${course} - ${courseTitle}`;
            this.refreshSectionStyles(this.sections);
        }
    }

    // Parse search input whenever the text changes
    searchInputChange() {
        const input = this.search.input;

        // If there is no input, show example
        if (input.length == 0) {
            this.search.help = this.search.example;
            return;
        }

        // Match CRN
        const crnRe = /\d{5}/;
        const crnMatches = input.match(crnRe);
        // If there is a CRN match, find the section
        if (crnMatches != null) {
            const crn = parseInt(crnMatches[0]);

            // Try to get section
            // Expecting dataService.get() to throw if CRN is invalid
            let section;
            try {
                section = this.dataService.getSection(crn);
            } catch (_) { }

            // If there is no section with CRN, show error message
            if (section == undefined) {
                this.search.set('help', `No section with CRN ${crn} is found`);
                return;
            }

            // Otherwise show this section
            this.search.set('help', `Found section with CRN ${crn}`);
            this.search.set('sections', [this.dataService.getSection(crn)]);
            return;
        }

        // Match subject alone
        const subjRe = /^[a-zA-Z]{3,4}$/;
        let subjMatches = input.match(subjRe);
        let courses;
        if (subjMatches != null) {
            const subject = subjMatches[0].toUpperCase();

            try {
                courses = this.dataService.getCourses(subject);
            } catch (_) { }
            if (courses == undefined) {
                this.search.set('help', `${subject} is not a valid subject`);

                return;
            }

            this.search.set('help', `Found ${courses.length} courses under ${subject}`);
            this.search.set('courses', courses);
            for (const course of courses) {
                course.style = this.courseStyle(course);
            }
            return;
        } else {
            this.search.set('courses', null);
        }

        // Match subject and course number
        const subjCourseRe = /[a-zA-Z]{3,4}\d{4}/;
        const subjCourseMatches = input.match(subjCourseRe);
        // If there is a match, find sections
        if (subjCourseMatches != null) {
            const subject = subjCourseMatches[0].slice(0, subjCourseMatches[0].length - 4).toUpperCase();
            const course = parseInt(subjCourseMatches[0].slice(-4));

            // Try to get sections
            // Expecting dataService.get() to throw if subject or course is invalid
            let sections;
            try {
                sections = this.dataService.getSections(subject, course);
            } catch (_) { }

            // If there is no sections, show error message
            if (sections == undefined) {
                this.search.set('help', `${subject}${course} is invalid`);
                return;
            }

            // Otherwise show sections
            this.search.set('help', `Found ${sections.length} sections under ${subject}${course}`);
            this.search.set('sections', sections);

            return;
        }

        // Match instructor name
        let instructor;
        // Try to find instructor
        // Expecting dataService.get() to throw if instructor name is invalid
        try {
            instructor = this.dataService.getInstructor(input);
        } catch (_) { }

        // If there is an instructor, show sections
        if (instructor !== undefined) {
            // No need to try-catch here, instructor is expected to be valid at this point
            const sections = this.dataService.getInstructorSections(instructor.name);
            this.search.set('help', `Found ${sections.length} sections taught by ${instructor.name}`);
            this.search.set('sections', sections);
            return;
        }

        // If nothing matched, show encouraging error message
        this.search.help = "Keep typing, it doesn't look like anything to me...";
    }
}

app.controller('courseSelectorCardControl', [
    '$rootScope',
    '$scope',
    '$mdDialog',
    '$mdToast',
    'dataService',
    'semesterService',
    CourseSelectorCardControl

]);
