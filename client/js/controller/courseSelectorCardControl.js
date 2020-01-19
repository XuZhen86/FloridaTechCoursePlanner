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

    // General function to handle UI clicks
    // UI should set 'key' to indicate type of click
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

    // Change toolbar text according to tab index
    $scope.setToolbar = async function (tabIndex) {
        // For search, also randomly select a section to show as example
        if (tabIndex == 0) {
            $scope.toolbar.button = 'Back';
            $scope.toolbar.title = 'Search sections';

            // Randomly select a section with instructor name
            const section = await dataService.get(
                'random-section',
                function (section) {
                    return section.instructor.length != 0;
                }
            );

            $scope.search.example = `Example: ${section.crn} or ${section.subject}${section.course} or ${section.instructor}`;
            $scope.search.help = $scope.search.example;
        }

        if (tabIndex == 1) {
            $scope.toolbar.button = 'Search';
            $scope.toolbar.title = 'Subjects';
        }

        if (tabIndex == 2) {
            const subject = $scope.toolbar.subject;
            const subjectTitle = (await dataService.get('subject', subject)).title;
            $scope.toolbar.button = 'Subject';
            $scope.toolbar.title = `${subject} - ${subjectTitle}`;
        }

        if (tabIndex == 3) {
            const subject = $scope.toolbar.subject;
            const course = $scope.toolbar.course;
            const courseTitle = (await dataService.get('course', subject, course)).title;
            $scope.toolbar.button = 'Course';
            $scope.toolbar.title = `${subject} ${course} - ${courseTitle}`;
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
            $scope.$digest();
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
    $scope.searchInputChange = async function () {
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
            let section = undefined;
            try {
                section = await dataService.get('section', crn);
            } catch (_) {}

            // If there is no section with CRN, show error message
            if (section == undefined) {
                $scope.search.set('help', `No section with CRN ${crn} is found`);
                return;
            }

            // Otherwise show this section
            $scope.search.set('help', `Found section with CRN ${crn}`);
            $scope.search.set('sections', [await dataService.get('section', crn)]);
            console.log(section);
            return;
        }

        // Match subject and course number
        const subjCourseRe = /[a-zA-z]{3,4}\d{4}/;
        const subjCourseMatches = input.match(subjCourseRe);
        // If there is a match, find sections
        if (subjCourseMatches != null) {
            const subject = subjCourseMatches[0].slice(0, subjCourseMatches[0].length - 4).toUpperCase();
            const course = parseInt(subjCourseMatches[0].slice(-4));
            // console.log(subject, course);

            // Try to get sections
            // Expecting dataService.get() to throw if subject or course is invalid
            let sections = undefined;
            try {
                sections = await dataService.get('sections', subject, course);
            } catch (_) {}

            // If there is no sections, show error message
            if (sections == undefined) {
                $scope.search.set('help', `${subject}${course} is invalid`);
                return;
            }

            // Otherwise show sections
            $scope.search.set('help', `Found ${sections.length} sections under ${subject}${course}`);
            $scope.search.set('sections', sections);
            // console.log(sections);
            return;
        }

        // Match instructor name
        let instructor = undefined;
        // Try to find instructor
        // Expecting dataService.get() to throw if instructor name is invalid
        try{
            instructor = await dataService.get('instructor', input);
        } catch (_) {}

        // If there is an instructor, show sections
        if (instructor !== undefined) {
            // No need to try-catch here, instructor is expected to be valid at this point
            const sections = await dataService.get('instructor-sections', instructor.name);
            $scope.search.set('help', `Found ${sections.length} sections taught by ${instructor.name}`);
            $scope.search.set('sections', sections);
            return;
        }

        // If nothing matched, show encouraging error message
        $scope.search.help = "Keep typing, it doesn't look like anything to me...";
    };

    $scope.magicTestButton = function () {
        console.log(this.tabIndex);
    }.bind(this);

    $rootScope.$broadcast('controllerReady', this.constructor.name);
});
