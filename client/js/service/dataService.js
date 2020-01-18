'use strict';

// Data Service provides course data to client
app.service('dataService', function dataService($rootScope, $http, performanceService) {
    // A flag to indicate if internal data source is ready
    this.isReady = false;

    // Start performance measurement
    performanceService.start('dataService.$http.get()');
    // Download source data
    $http.get('/client/data/data.json').then(
        // If everything goes well, install the data and broadcast success message
        async function (response) {
            Object.assign(this, response.data);
            this.isReady = true;
            $rootScope.$broadcast('dataService.init.success');
            $rootScope.$broadcast('serviceReady', this.constructor.name);
        }.bind(this),
        // If there is an error, do nothing and broadcast error message
        function (response) {
            $rootScope.$broadcast('dataService.init.error', response);
        }.bind(this)
    ).finally(
        // Always stop performance measurement when http complete
        function () {
            performanceService.stop('dataService.$http.get()');
        }
    );

    // Retrieve data
    this.get = async function (key, ...args) {
        // If the data is not ready, throw
        if (!this.isReady) {
            throw undefined;
        }

        let result = undefined;

        // Get list of subjects
        if (key == 'subjects') {
            result = this.subjects;
        }

        // Get 1 subject, based on the subject key
        if (key == 'subject') {
            const [subjectKey] = args;
            const subject = this.subjects.find(subject => subject.subject == subjectKey, this);
            result = subject;
        }

        // Get list of courses under subject
        if (key == 'courses') {
            const [subjectKey] = args;
            const subject = await this.get('subject', subjectKey);
            const courses = subject.courseIdxs.map(index => this.courses[index], this);
            result = courses;
        }

        // Get 1 course, based on subject key and course key
        if (key == 'course') {
            const [subjectKey, courseKey] = args;
            const courses = await this.get('courses', subjectKey);
            const course = courses.find(course => course.course == courseKey, this);
            result = course;
        }

        // Get list of sections under course
        if (key == 'sections') {
            const [subjectKey, courseKey] = args;
            const course = await this.get('course', subjectKey, courseKey);
            const sections = course.sectionIdxs.map(index => this.sections[index], this);
            result = sections;
        }

        // Get 1 section based on CRN
        // Because the array is sorted by CRN, we use binary search
        if (key == 'section') {
            const [crn] = args;
            let l = 0;
            let r = this.sections.length - 1;

            while (l <= r) {
                const m = Math.floor((l + r) / 2);
                const section = this.sections[m];

                if (section.crn == crn) {
                    result = section;
                    break;
                }

                if (section.crn < crn) l = m + 1;
                else r = m - 1;
            }
        }

        // Get the list of all sections
        if (key == 'all-sections') {
            result = this.sections;
        }

        // Get info about an instructor
        if (key == 'instructor') {
            const [nameKey] = args;
            const instructor = this.instructors.find(instructor => instructor.name.toUpperCase() == nameKey.toUpperCase(), this);
            result = instructor;
        }

        // Get list of sections taught by an instructor
        if (key == 'instructor-sections') {
            const [nameKey] = args;
            const instructor = await this.get('instructor', nameKey);
            const sections = instructor.sectionIdxs.map(index => this.sections[index], this);
            sections.sort(
                function callback(a, b) {
                    if (a.subject != b.subject) {
                        return a.subject.localeCompare(b.subject);
                    }
                    if (a.course != b.course) {
                        return a.course - b.course;
                    }
                    return a.crn - b.crn;
                }
            );
            result = sections;
        }

        // Get time stamp of when the data was generated
        // Early return to dodge being JSON stringified
        if (key == 'timestamp') {
            return new Date(this.timestamp * 1000);
        }

        // Always construct a deep copy of result to keep internal data from being modified
        if (result == undefined) {
            throw undefined;
        } else {
            return JSON.parse(JSON.stringify(result));
        }
    };
});
