'use strict';

/**
 * Course Selector Card Control controls the course selector.
 * @module courseSelectorCardControl
 * @requires dataService
 * @requires semesterService
 */
app.controller('courseSelectorCardControl', function courseSelectorCardControl($rootScope, $scope, $mdDialog, $mdToast, dataService, semesterService) {
    /**
     * Absolute path to HTML template file. Used by ng-include.
     * @name "$scope.url"
     * @type {string}
     * @constant
     * @see {@link https://docs.angularjs.org/api/ng/directive/ngInclude}
     */
    $scope.url = '../html/semesterPlanner/courseSelectorCard.html';

    /**
     * Tab index of currently shown tab.
     * There is a bug in AngularJS that tabIndex must be a controller variable.
     * @type {number}
     */
    this.tabIndex = 1;

    /**
     * List of subjects.
     * @name "$scope.subjects"
     * @type {Subject[]}
     */
    $scope.subjects = [];

    /**
     * List of courses.
     * @name "$scope.courses"
     * @type {Course[]}
     */
    $scope.courses = [];

    /**
     * List of sections.
     * @name "$scope.sections"
     * @type {Section[]}
     */
    $scope.sections = [];

    /**
     * Switch to Subjects tab after successful downloading the data.
     * @param {object} event Event object supplied by AngularJS.
     * @example courseSelectorCardControl.showInitialTab(event);
     * @example $scope.$on('dataService#initSuccess', this.showInitialTab.bind(this));
     * @listens module:dataService#initSuccess
     */
    this.showInitialTab = function showInitialTab(event) {
        this.showSubjects();
    };

    // Show Subject tab after downloading data.
    $scope.$on('dataService#initSuccess', this.showInitialTab.bind(this));

    /**
     * Show a course by simulating user clicks.
     * Used when jump to course without clicking.
     * @param {object} event Event object supplied by AngularJS.
     * @param {string} subject Subject name.
     * @param {number} course Course number.
     * @example courseSelectorCardControl.gotoCourse('CSE', 1001);
     * @example $scope.$on('calendarCardControl#gotoCourse', this.gotoCourse.bind(this));
     * @listens module:calendarCardControl#gotoCourse
     */
    this.gotoCourse = function gotoCourse(event, subject, course) {
        // Simulate a click on UI
        $scope.subjectClick({ subject: subject });
        $scope.courseClick({ subject: subject, course: course });
        $scope.setToolbar(3);
        $scope.$digest();
    };

    // Called when calendar requests to show sections of a course
    $scope.$on('calendarCardControl#gotoCourse', this.gotoCourse.bind(this));

    // Called when course selector's search requests to show sections of a course
    $scope.showSearchedCourse = function showSearchedCourse(course) {
        const subject = dataService.getSubject(course.subject).subject;
        // Simulate a click on UI
        $scope.subjectClick({ subject: subject });
        $scope.courseClick({ subject: subject, course: course.course });
        $scope.setToolbar(3);
        $scope.$digest();
    };

    /**
     * Click handler for subjects.
     * Switch to courses tab and refresh course styles.
     * @function "$scope.subjectClick"
     * @param {Subject} subject Subject object, directly supplied by HTML.
     * @example <md-list-item class="md-2-line" ng-repeat="subject in subjects" ng-click="subjectClick(subject)" ng-style="">...</md-list-item>
     */
    $scope.subjectClick = function subjectClick(subject) {
        this.showCourses(subject.subject);
    }.bind(this);

    /**
     * Click handler for courses.
     * Switch to sections tab and refresh section styles.
     * @function "$scope.courseClick"
     * @param {Course} course Course object, directly supplied by HTML.
     * @example <md-list-item class="md-2-line" ng-repeat="course in courses" ng-click="courseClick(course)" ng-style="course.style">...</md-list-item>
     */
    $scope.courseClick = function courseClick(course) {
        this.showSections(course.subject, course.course);
    }.bind(this);

    /**
     * Click handler for sections.
     * Decide to either add, remove, switch sections.
     * @function "$scope.sectionClick"
     * @param {Section} section Section object, directly supplied by HTML.
     * @example <md-list-item class="md-2-line" ng-repeat="section in sections" ng-click="sectionClick(section)" ng-style="section.style" ng-mouseenter="mouseEnter(section)" ng-mouseleave="mouseLeave(section)">...</md-list-item>
     */
    $scope.sectionClick = function sectionClick(section) {
        const crn = section.crn;

        // If this section is added, remove it
        if (semesterService.isSectionAdded(crn)) {
            semesterService.removeSection(crn);
            $mdToast.showSimple(`Removed section ${crn}`);
            this.refreshSectionStyles($scope.sections);
            return;
        }

        const subject = section.subject;
        const course = section.course;
        const isCourseAdded = semesterService.isCourseAdded(subject, course);
        const isSectionFull = section.cap[0] >= section.cap[1];

        // If another section within the same course is added && this section is not full,
        // Then switch to this section
        if (isCourseAdded && !isSectionFull) {
            // Remove all sections of this course
            semesterService.removeCourse(subject, course);
            semesterService.addSection(crn);
            $mdToast.showSimple(`Switched to section ${crn}`);
            this.refreshSectionStyles($scope.sections);
            return;
        }

        // If another section within the same course is added, && this section is full,
        // Then ask user first and switch to this course
        if (isCourseAdded && isSectionFull) {
            $mdDialog.show({
                contentElement: '#fullSectionSwitchDialog',
                clickOutsideToClose: true
            }).then(
                // Confirm. Add the section.
                function confirm(args) {
                    semesterService.removeCourse(subject, course);
                    semesterService.addSection(crn);
                    $mdToast.showSimple(`Switched to section ${crn}`);
                    this.refreshSectionStyles($scope.sections);
                }.bind(this),
                // Cancel. Do nothing.
                function cancel(args) { }
            );
            return;
        }

        // If this section conflicts with 1 or more added sections, ask user
        if (semesterService.isSectionConflict(crn)) {
            $mdDialog.show({
                contentElement: '#conflictSectionDialog',
                clickOutsideToClose: true
            }).then(
                // Confirm. Add the section.
                function confirm(args) {
                    semesterService.addSection(crn);
                    $mdToast.showSimple(`Added section ${crn}`);
                    this.refreshSectionStyles($scope.sections);
                }.bind(this),
                // Cancel. Do nothing.
                function cancel(args) { }
            );

            return;
        }

        // If this section is full, ask user
        // TODO: Add the link to form
        if (isSectionFull) {
            $mdDialog.show({
                contentElement: '#fullSectionDialog',
                clickOutsideToClose: true
            }).then(
                // Confirm. Add the section.
                function confirm(args) {
                    semesterService.addSection(crn);
                    $mdToast.showSimple(`Added section ${crn}`);
                    this.refreshSectionStyles($scope.sections);
                }.bind(this),
                // Cancel. Do nothing.
                function cancel(args) { }
            );

            return;
        }

        // Otherwise, add the section
        semesterService.addSection(crn);
        $mdToast.showSimple(`Added section ${crn}`);
        this.refreshSectionStyles($scope.sections);
    }.bind(this);

    /**
     * Click handler for toolbar back button.
     * Decide to return to previous tab or to search tab.
     * @function "$scope.toolbarClick"
     * @example <md-button class="md-raised" ng-click="toolbarClick()">...</md-button>
     */
    $scope.toolbarClick = function toolbarClick() {
        if (this.tabIndex == 0) {
            this.tabIndex = 1;
        } else {
            this.tabIndex--;
        }
    }.bind(this);

    /**
     * Supportive object containing information for course info dialog.
     * @name "$scope.courseInfoDialog"
     * @type {object}
     * @property {Course} course Course object.
     * @property {Section[]} sections List of sections.
     */
    $scope.courseInfoDialog = {
        course: {},
        sections: []
    };

    /**
     * Handle click of a course icon.
     * Show course info dialog.
     * @function "$scope.courseIconClick"
     * @param {Course} course The course to be shown.
     * @example <md-button class="md-raised md-icon-button" ng-click="courseIconClick(course)" aria-label="label">...</md-button>
     */
    $scope.courseIconClick = function courseIconClick(course) {
        $scope.courseInfoDialog.course = course;
        $scope.courseInfoDialog.sections = dataService.getSections(course.subject, course.course);
        $mdDialog.show({
            contentElement: '#courseInfoDialog',
            clickOutsideToClose: true
        }).then(
            function confirm(args) {
                if (args[0] == 'showSections') {
                    const course = $scope.courseInfoDialog.course;
                    this.showSections(course.subject, course.course);
                }
            },
            function cancel(args) { }
        );
    }.bind(this);

    /**
     * Supportive object containing information for section info dialog.
     * @name "$scope.sectionInfoDialog"
     * @type {object}
     * @property {Section} section Section object.
     */
    $scope.sectionInfoDialog = {
        section: {}
    };

    /**
     * Handle click of a section icon.
     * @function "$scope.sectionIconClick"
     * @param {Section} section The section to be shown.
     * @example <md-button class="md-raised md-icon-button" ng-click="sectionIconClick(section)" aria-label="label">...</md-button>
     */
    $scope.sectionIconClick = function sectionIconClick(section) {
        $scope.sectionInfoDialog.section = section;
        $mdDialog.show({
            contentElement: '#sectionInfoDialog',
            clickOutsideToClose: true
        }).then(
            function confirm(args) {
                $scope.click('section', section);
            },
            function cancel(args) {
                console.log('cancel');
            }
        );
    };

    /**
     * Confirm dialog with arguments.
     * This function is called from dialogs to close the dialog.
     * @function "$scope.dialogConfirm"
     * @param {object[]} args Arguments list.
     * @example <md-button class="md-raised" ng-click="dialogConfirm('print')" ng-disabled="true">...</md-button>
     * @see {@link https://material.angularjs.org/latest/api/service/$mdDialog#mddialog-hide-response}
     */
    $scope.dialogConfirm = function dialogConfirm(...args) {
        $mdDialog.hide(args);
    };

    /**
     * Cancel dialog with arguments.
     * This function is called from dialogs to close the dialog.
     * @function "$scope.dialogCancel"
     * @param {object[]} args Arguments list.
     * @example <md-button class="md-raised" ng-click="dialogCancel()">Cancel</md-button>
     * @see {@link https://material.angularjs.org/latest/api/service/$mdDialog#mddialog-cancel-response}
     */
    $scope.dialogCancel = function dialogCancel(...args) {
        $mdDialog.cancel(args);
    };

    /**
     * Give style to courses.
     * @param {Course} course The course to be styled.
     * @returns {object} The object containing style information. This object is usually fed into ng-style.
     * @see {@link https://docs.angularjs.org/api/ng/directive/ngStyle}
     * @example const style = courseSelectorCardControl.courseStyle(course);
     */
    this.courseStyle = function courseStyle(course) {
        const green = '#dff0d8';
        const red = '#f2dede';
        const yellow = '#fcf8e3';

        // If this course has a section that is in the list
        if (semesterService.isCourseAdded(course.subject, course.course)) {
            return {
                'background-color': green,
                'status': 'green'
            };
        }

        // If all of this course's section conflict with sections in the list
        if (semesterService.isCourseConflict(course.subject, course.course)) {
            return {
                'background-color': red,
                'status': 'red'
            };
        }

        // If all of this course's sections are full
        const sections = dataService.getSections(course.subject, course.course);
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
    };

    /**
     * Generate style for list of courses.
     * @param {Course[]} courses List of courses.
     * @example courseSelectorCardControl.refreshCourseStyles(courses);
     */
    this.refreshCourseStyles = function refreshCourseStyles(courses) {
        for (const course of courses) {
            course.style = this.courseStyle(course);
        }
    };

    /**
     * Give style to sections.
     * @param {Section} section The section to be styled.
     * @returns {object} The object containing style information. This object is usually fed into ng-style.
     * @see {@link https://docs.angularjs.org/api/ng/directive/ngStyle}
     * @example courseSelectorCardControl.sectionStyle(section);
     */
    this.sectionStyle = function sectionStyle(section) {
        const green = '#dff0d8';
        const red = '#f2dede';
        const yellow = '#fcf8e3';

        const crn = section.crn;

        // If this section is already added to the list
        if (semesterService.isSectionAdded(crn)) {
            return {
                'background-color': green,
                'status': 'green'
            };
        }

        // If this section conflicts with any of the added sections
        if (semesterService.isSectionConflict(crn)) {
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
    };

    /**
     * Generate style for list of sections.
     * @param {Section[]} sections List of sections.
     * @example courseSelectorCardControl.refreshSectionStyles(sections);
     */
    this.refreshSectionStyles = function refreshSectionStyles(sections) {
        for (const section of sections) {
            section.style = this.sectionStyle(section);
        }
    };

    /**
     * Mouse hover enters section.
     * @function "$scope.mouseEnter"
     * @param {Section} section
     */
    $scope.mouseEnter = function mouseEnter(section) {
        const crn = section.crn;
        semesterService.addTempSection(crn);
    };

    /**
     * Mouse hover leaves section.
     * @function "$scope.mouseLeave"
     * @param {Section} section
     */
    $scope.mouseLeave = function mouseLeave(section) {
        const crn = section.crn;
        semesterService.removeTempSection(crn);
    };

    /**
     * Supportive object containing strings to be shown on toolbar.
     * @name "$scope.toolbar"
     * @type {object}
     * @property {string} button Button text.
     * @property {string} title Title text.
     * @property {string} subject Subject text.
     * @property {string} course Course text.
     */
    $scope.toolbar = {
        button: '',
        title: '',
        subject: '',
        course: ''
    };

    /**
     * Switch to subjects tab.
     * @example courseSelectorCardControl.showSubjects();
     */
    this.showSubjects = function showSubjects() {
        // Fetch list of subjects
        const subjects = dataService.getSubjects();

        // Refine to only contain essential data
        $scope.subjects = subjects.map(
            function refine(subject) {
                return {
                    subject: subject.subject,
                    title: subject.title,
                    nCourses: subject.courseIdxs.length
                };
            }
        );

        // Switch to subject tab
        this.tabIndex = 1;

        // Set toolbar text
        // Switching to a new tab auto triggers this function
        // $scope.setToolbar(1);
    };

    /**
     * Switch to courses tab, show courses under subject, and refresh course styles.
     * @param {string} subject Subject name.
     * @example courseSelectorCardControl.showCourses('CSE');
     */
    this.showCourses = function showCourses(subject) {
        // If subject is not provided,
        // Get the subject that's already showing
        if (subject == undefined) {
            subject = $scope.toolbar.subject;
        }

        // Fetch list of course based on given subject
        const courses = dataService.getCourses(subject);

        // Refine to only contain essential data
        $scope.courses = courses.map(
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

        // This is done in $scope.setToolbar()
        // this.refreshCourseStyles($scope.courses);

        // Switch to course tab
        this.tabIndex = 2;

        // Set toolbar text
        $scope.toolbar.subject = subject;

        // Switching to a new tab auto triggers this function
        // $scope.setToolbar(2);
    };

    /**
     * Switch to sections tab, show section under course, and refresh section styles.
     * @param {string} subject Subject name.
     * @param {number} course Course number.
     * @example courseSelectorCardControl.showSections('CSE', 1001);
     */
    this.showSections = function showSections(subject, course) {
        // If subject or course number is not provided,
        // Get the subject and course number that's already showing
        if (subject == undefined || course == undefined) {
            subject = $scope.toolbar.subject;
            course = $scope.toolbar.course;
        }

        // Fetch list of sections based on given subject and course number
        const sections = dataService.getSections(subject, course);

        // Refine to only contain essential data
        $scope.sections = sections.map(
            function refine(section) {
                section.style = {};
                return section;
            }
        );

        // This is done in $scope.setToolbar()
        // this.refreshSectionStyles($scope.sections);

        // Switch to section tab
        this.tabIndex = 3;

        // Set toolbar text
        $scope.toolbar.subject = subject;
        $scope.toolbar.course = course;

        // Switching to a new tab auto triggers this function
        // $scope.setToolbar(3);
    };

    /**
     * Change toolbar text according to tab index.
     * @function "$scope.setToolbar"
     * @param {number} tabIndex Which tab to switch to.
     * @example <md-tab label="Search" md-on-select="setToolbar(0)">...</md-tab>
     */
    $scope.setToolbar = function setToolbar(tabIndex) {
        // For search, also randomly select a section to show as example
        if (tabIndex == 0) {
            $scope.toolbar.button = 'Back';
            $scope.toolbar.title = 'Search sections';

            // Randomly select a section with instructor name
            const section = dataService.getRandomSection(
                section => section.instructor.length != 0
            );

            $scope.search.example = `Example: ${section.crn} or ${section.subject} or ${section.subject}${section.course} or ${section.instructor}`;
            $scope.search.help = $scope.search.example;
        }

        if (tabIndex == 1) {
            $scope.toolbar.button = 'Search';
            $scope.toolbar.title = 'Subjects';
        }

        if (tabIndex == 2) {
            const subject = $scope.toolbar.subject;
            const subjectTitle = dataService.getSubject(subject).title;
            $scope.toolbar.button = 'Subject';
            $scope.toolbar.title = `${subject} - ${subjectTitle}`;
            this.refreshCourseStyles($scope.courses);
        }

        if (tabIndex == 3) {
            const subject = $scope.toolbar.subject;
            const course = $scope.toolbar.course;
            const courseTitle = dataService.getCourse(subject, course).title;
            $scope.toolbar.button = 'Course';
            $scope.toolbar.title = `${subject} ${course} - ${courseTitle}`;
            this.refreshSectionStyles($scope.sections);
        }
    }.bind(this);

    // Variable related to search feature
    // Use set() if AngularJS does not refresh UI after changing the variable
    $scope.search = {
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

    // Parse search input whenever the text changes
    $scope.searchInputChange = function searchInputChange() {
        const input = $scope.search.input;

        // If there is no input, show example
        if (input.length == 0) {
            $scope.search.help = $scope.search.example;
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
                section = dataService.getSection(crn);
            } catch (_) { }

            // If there is no section with CRN, show error message
            if (section == undefined) {
                $scope.search.set('help', `No section with CRN ${crn} is found`);
                return;
            }

            // Otherwise show this section
            $scope.search.set('help', `Found section with CRN ${crn}`);
            $scope.search.set('sections', [dataService.getSection(crn)]);
            return;
        }

        // Match subject alone
        const subjRe = /^[a-zA-Z]{3,4}$/;
        let subjMatches = input.match(subjRe);
        let courses;
        if (subjMatches != null) {
            const subject = subjMatches[0].toUpperCase();

            try {
                courses = dataService.getCourses(subject);
            } catch (_) { }
            if (courses == undefined) {
                $scope.search.set('help', `${subject} is not a valid subject`);

                return;
            }

            $scope.search.set('help', `Found ${courses.length} courses under ${subject}`);
            $scope.search.set('courses', courses);
            for (const course of courses) {
                course.style = this.courseStyle(course);
            }
            return;
        } else {
            $scope.search.set('courses', null);
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
                sections = dataService.getSections(subject, course);
            } catch (_) { }

            // If there is no sections, show error message
            if (sections == undefined) {
                $scope.search.set('help', `${subject}${course} is invalid`);
                return;
            }

            // Otherwise show sections
            $scope.search.set('help', `Found ${sections.length} sections under ${subject}${course}`);
            $scope.search.set('sections', sections);

            return;
        }

        // Match instructor name
        let instructor;
        // Try to find instructor
        // Expecting dataService.get() to throw if instructor name is invalid
        try {
            instructor = dataService.getInstructor(input);
        } catch (_) { }

        // If there is an instructor, show sections
        if (instructor !== undefined) {
            // No need to try-catch here, instructor is expected to be valid at this point
            const sections = dataService.getInstructorSections(instructor.name);
            $scope.search.set('help', `Found ${sections.length} sections taught by ${instructor.name}`);
            $scope.search.set('sections', sections);
            return;
        }

        // If nothing matched, show encouraging error message
        $scope.search.help = "Keep typing, it doesn't look like anything to me...";
    }.bind(this);

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});
