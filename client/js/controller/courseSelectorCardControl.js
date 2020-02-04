'use strict';

app.controller('courseSelectorCardControl', function courseSelectorCardControl($rootScope, $scope, $mdDialog, $mdToast, dataService, semesterService) {
    $scope.url = '/client/html/semesterPlanner/courseSelectorCard.html';

    // There is a bug in AngularJS that tabIndex must be a controller variable
    this.tabIndex = 1;
    $scope.subjects = [];
    $scope.courses = [];
    $scope.sections = [];

    $scope.$on('dataService.init.success', function success() {
        $scope.showSubjects();
    }.bind(this));

    // Called when calendar requests to show sections of a course
    $scope.$on('calendarCardControl.gotoCourse', function gotoCourse(event, subject, course) {
        // Simulate a click on UI
        $scope.click('subject', { subject: subject });
        $scope.click('course', { subject: subject, course: course });
        $scope.setToolbar(3);
        $scope.$digest();
    }.bind(this));

    // Called when course selector's search requests to show sections of a course
    $scope.showSearchedCourse =  function showSearchedCourse(course) {
        const subject = dataService.getSubject(course.subject).subject;
        // Simulate a click on UI
        $scope.click('subject', { subject: subject });
        $scope.click('course', { subject: subject, course: course.course });
        $scope.setToolbar(3);
        $scope.$digest();
    }.bind(this);

    // General function to handle UI clicks
    // UI should set 'key' to indicate type of click
    $scope.click = function click(key, value) {
        if (key == 'subject') {
            const subject = value.subject;
            $scope.showCourses(subject);
            $scope.refreshCourseStyles();
        }

        if (key == 'course') {
            const subject = value.subject;
            const course = value.course;
            $scope.showSections(subject, course);
        }

        if (key == 'section') {
            const section = value;
            const crn = section.crn;

            // If this section is added, remove it
            if (semesterService.isSectionAdded(crn)) {
                semesterService.removeSection(crn);
                $mdToast.showSimple(`Removed section ${crn}`);
                $scope.refreshSectionStyles();
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
                $scope.refreshSectionStyles();
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
                    function confirm() {
                        semesterService.removeCourse(subject, course);
                        semesterService.addSection(crn);
                        $mdToast.showSimple(`Switched to section ${crn}`);
                        $scope.refreshSectionStyles();
                    },
                    // Cancel. Do nothing.
                    function cancel() { }
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
                    function confirm() {
                        semesterService.addSection(crn);
                        $mdToast.showSimple(`Added section ${crn}`);
                        $scope.refreshSectionStyles();
                    },
                    // Cancel. Do nothing.
                    function cancel() { }
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
                    function confirm() {
                        semesterService.addSection(crn);
                        $mdToast.showSimple(`Added section ${crn}`);
                        $scope.refreshSectionStyles();
                    },
                    // Cancel. Do nothing.
                    function cancel() { }
                );

                return;
            }

            // Otherwise, add the section
            semesterService.addSection(crn);
            $mdToast.showSimple(`Added section ${crn}`);
            $scope.refreshSectionStyles();
        }

        // Toolbar button should revert to previous tab
        // Search tab should turn to Subject tab
        if (key == 'toolbar') {
            if (this.tabIndex == 0) {
                this.tabIndex = 1;
            } else {
                this.tabIndex--;
            }
        }
    }.bind(this);

    $scope.courseInfoDialog = {
        course: {},
        sections: []
    };

    $scope.courseIconClick = function courseIconClick(course) {
        $scope.courseInfoDialog.course = course;
        $scope.courseInfoDialog.sections = dataService.getSections(course.subject, course.course);
        $mdDialog.show({
            contentElement: '#courseInfoDialog',
            clickOutsideToClose: true
        }).then(
            function confirm(values) {
                if (values[1] == 'showSections') {
                    const course = $scope.courseInfoDialog.course;
                    $scope.showSections(course.subject, course.course);
                }
            },
            function cancel() { }
        );
    };

    $scope.sectionInfoDialog = {
        section: {}
    };

    $scope.sectionIconClick = function sectionIconClick(section) {
        $scope.sectionInfoDialog.section = section;
        $mdDialog.show({
            contentElement: '#sectionInfoDialog',
            clickOutsideToClose: true
        }).then(
            function confirm(values) {
                $scope.click('section', section);
            },
            function cancel() {
                console.log('cancel');
            }
        );
    };

    // Handler of dialog button clicks
    $scope.dialog = function dialog(...values) {
        if (values[0] == 'cancel') {
            $mdDialog.cancel(values);
        }

        if (values[0] == 'confirm') {
            $mdDialog.hide(values);
        }
    };

    // Give color code to course
    // When constructing a course list, this func is called to give the color
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

    // Refresh color of the list of course shown
    $scope.refreshCourseStyles = function refreshCourseStyles() {
        for (const course of $scope.courses) {
            course.style = this.courseStyle(course);
        }
    }.bind(this);

    // Give color code to sections
    // when constructing a section list, this func is called to give the color
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

    $scope.refreshSectionStyles = function refreshSectionStyles() {
        for (const section of $scope.sections) {
            section.style = this.sectionStyle(section);
        }
    }.bind(this);

    // Mouse hover enters section
    $scope.mouseEnter = function mouseEnter(section) {
        const crn = section.crn;
        semesterService.addTempSection(crn);
    };

    // Mouse hover leaves section
    $scope.mouseLeave = function mouseLeave(section) {
        const crn = section.crn;
        semesterService.removeTempSection(crn);
    };

    // Variable to control toolbar
    $scope.toolbar = {
        button: '',
        title: '',
        subject: '',
        course: ''
    };

    // Refresh list of subjects, then
    // Switch to subject tab, set toolbar text
    $scope.showSubjects = function showSubjects() {
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
    }.bind(this);

    // Refresh list of courses, then
    // Switch to course tab, set toolbar text
    $scope.showCourses = function showCourses(subject) {
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
            }.bind(this)
        );

        // Switch to course tab
        this.tabIndex = 2;

        // Set toolbar text
        $scope.toolbar.subject = subject;
        // Switching to a new tab auto triggers this function
        // $scope.setToolbar(2);

        $scope.refreshCourseStyles();
    }.bind(this);

    // Refresh list of sections, then
    // Switch to section tab, set toolbar text
    $scope.showSections = function showSections(subject, course) {
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
            }.bind(this)
        );

        // Switch to section tab
        this.tabIndex = 3;

        // Set toolbar text
        $scope.toolbar.subject = subject;
        $scope.toolbar.course = course;
        // Switching to a new tab auto triggers this function
        // $scope.setToolbar(3);
    }.bind(this);

    // Change toolbar text according to tab index
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
            $scope.refreshCourseStyles();
        }

        if (tabIndex == 3) {
            const subject = $scope.toolbar.subject;
            const course = $scope.toolbar.course;
            const courseTitle = dataService.getCourse(subject, course).title;
            $scope.toolbar.button = 'Course';
            $scope.toolbar.title = `${subject} ${course} - ${courseTitle}`;
            $scope.refreshSectionStyles();
        }
    };

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
        const subjRe = /^[a-zA-z]{3,4}$/;
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
        const subjCourseRe = /[a-zA-z]{3,4}\d{4}/;
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
