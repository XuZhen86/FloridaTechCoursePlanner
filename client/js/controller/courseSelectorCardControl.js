'use strict';

app.controller('courseSelectorCardControl', function courseSelectorCardControl($rootScope, $scope, dataService) {
    $scope.url = '/client/html/semesterPlanner/courseSelectorCard.html';

    // There is a bug in AngularJS that tabIndex must be a controller variable
    this.tabIndex = 1;
    $scope.subjects = [];
    $scope.courses = [];
    $scope.sections = [];

    $scope.$on('dataService.init.success', async function () {
        $scope.showSubjects();
    }.bind(this));

    $scope.click = function (key, value) {
        if (key == 'subject') {
            const subject = value.subject;
            $scope.showCourses(subject)
        }

        if (key == 'course') {
            const subject = value.subject;
            const course = value.course;
            $scope.showSections(subject, course);
        }

        if (key == 'section') {

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

    // Variable to control toolbar
    $scope.toolbar = {
        button: '',
        title: '',
        subject: '',
        course: ''
    };

    // Refresh list of subjects, then
    // Switch to subject tab, set toolbar text
    $scope.showSubjects = async function () {
        // Fetch list of subjects
        const subjects = await dataService.get('subjects');

        // Refine to only contain essential data
        $scope.subjects = subjects.map(
            function (subject) {
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
        // $scope.setHeader(1);
    }.bind(this);

    // Refresh list of courses, then
    // Switch to course tab, set toolbar text
    $scope.showCourses = async function (subject) {
        // If subject is not provided,
        // Get the subject that's already showing
        if (subject == undefined) {
            subject = $scope.toolbar.subject;
        }

        // Fetch list of course based on given subject
        const courses = await dataService.get('courses', subject);

        // Refine to only contain essential data
        $scope.courses = courses.map(
            function (course) {
                return {
                    subject: course.subject,
                    course: course.course,
                    cr: course.cr,
                    tags: course.tags,
                    title: course.title,
                    nSections: course.sectionIdxs.length
                };
            }
        );

        // Switch to course tab
        this.tabIndex = 2;

        // Set toolbar text
        $scope.toolbar.subject = subject;
        // Switching to a new tab auto triggers this function
        // $scope.setHeader(2);
    }.bind(this);

    // Refresh list of sections, then
    // Switch to section tab, set toolbar text
    $scope.showSections = async function (subject, course) {
        // If subject or course number is not provided,
        // Get the subject and course number that's already showing
        if (subject == undefined || course == undefined) {
            subject = $scope.toolbar.subject;
            course = $scope.toolbar.course;
        }

        // Fetch list of sections based on given subject and course number
        const sections = await dataService.get('sections', subject, course);

        // Refine to only contain essential data
        $scope.sections = sections;

        // Switch to section tab
        this.tabIndex = 3;

        // Set toolbar text
        $scope.toolbar.subject = subject;
        $scope.toolbar.course = course;
        // Switching to a new tab auto triggers this function
        // $scope.setHeader(3);
    }.bind(this);

    $scope.setHeader = async function (tabIndex) {
        if (tabIndex == 0) {
            $scope.toolbar.button = 'Subjects';
            $scope.toolbar.title = 'Search';
        }

        if (tabIndex == 1) {
            $scope.toolbar.button = 'Search';
            $scope.toolbar.title = 'Subjects';
        }

        if (tabIndex == 2) {
            const subject = $scope.toolbar.subject;
            const subjectTitle = (await dataService.get('subject', subject)).title;
            $scope.toolbar.button = 'Subject';
            $scope.toolbar.title = subjectTitle;
        }

        if (tabIndex == 3) {
            const subject = $scope.toolbar.subject;
            const course = $scope.toolbar.course;
            const courseTitle = (await dataService.get('course', subject, course)).title;
            $scope.toolbar.button = 'Course';
            $scope.toolbar.title = courseTitle;
        }
    }

    $scope.magicTestButton = function () {
        console.log(this.tabIndex);
    }.bind(this);

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});
