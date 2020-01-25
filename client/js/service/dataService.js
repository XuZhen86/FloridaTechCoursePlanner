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
        function success(response) {
            Object.assign(this, response.data);
            this.isReady = true;
            $rootScope.$broadcast('dataService.init.success');
            $rootScope.$broadcast('serviceReady', this.constructor.name);
        }.bind(this),
        // If there is an error, do nothing and broadcast error message
        function fail(response) {
            $rootScope.$broadcast('dataService.init.error', response);
        }.bind(this)
    ).finally(
        // Always stop performance measurement when http complete
        function always() {
            performanceService.stop('dataService.$http.get()');
        }
    );

    // Create a copy of an object
    this.copy = function copy(obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    // Get list of subjects
    this.getSubjects = function getSubjects() {
        return this.copy(this.subjects);
    };

    // Get 1 subject, based on the subject key
    this.getSubject = function getSubject(subjectKey) {
        const subject = this.subjects.find(
            subject => subject.subject == subjectKey,
            this
        );
        return this.copy(subject);
    };

    // Get list of courses under subject
    this.getCourses = function getCourses(subjectKey) {
        const subject = this.subjects.find(
            subject => subject.subject == subjectKey,
            this
        );
        const courses = subject.courseIdxs.map(
            index => this.courses[index],
            this
        );
        return courses;
    };

    // Get 1 course, based on subject key and course key
    this.getCourse = function getCourse(subjectKey, courseKey) {
        const subject = this.subjects.find(
            subject => subject.subject == subjectKey,
            this
        );
        const courseIndex = subject.courseIdxs.find(
            index => this.courses[index].course == courseKey,
            this
        );
        const course = this.courses[courseIndex];
        return this.copy(course);
    };

    // Get list of sections under course
    this.getSections = function getSections(subjectKey, courseKey) {
        const subject = this.subjects.find(
            subject => subject.subject == subjectKey,
            this
        );
        const courseIndex = subject.courseIdxs.find(
            index => this.courses[index].course == courseKey,
            this
        );
        const sectionIndexes = this.courses[courseIndex].sectionIdxs;
        const sections = sectionIndexes.map(
            index => this.sections[index],
            this
        );
        return sections;
    };

    // Get 1 section based on CRN
    this.getSectionCrns = function getSectionCrns(subjectKey, courseKey) {
        const subject = this.subjects.find(
            subject => subject.subject == subjectKey,
            this
        );
        const courseIndex = subject.courseIdxs.find(
            index => this.courses[index].course == courseKey,
            this
        );
        const sectionIndexes = this.courses[courseIndex].sectionIdxs;
        const sectionCrns = sectionIndexes.map(
            index => this.sections[index].crn,
            this
        );
        return sectionCrns;
    };

    this.getSection = function getSection(crn) {
        let l = 0;
        let r = this.sections.length - 1;

        while (l <= r) {
            const m = Math.floor((l + r) / 2);
            const section = this.sections[m];

            if (section.crn == crn) {
                return this.copy(section);
            }

            if (section.crn < crn) {
                l = m + 1;
            } else {
                r = m - 1;
            }
        }

        return undefined;
    };

    // Get the list of all sections
    this.getAllSections = function getAllSections() {
        return this.copy(this.sections);
    };

    // Get info about an instructor
    this.getInstructor = function getInstructor(name) {
        name = name.toUpperCase();

        let l = 0;
        let r = this.instructors.length - 1;

        while (l <= r) {
            const m = Math.floor((l + r) / 2);
            const instructor = this.instructors[m];
            const nameUpperCase = instructor.name.toUpperCase();

            switch (name.localeCompare(nameUpperCase)) {
                case -1:
                    r = m - 1;
                    break;
                case 0:
                    return this.copy(instructor);
                case 1:
                    l = m + 1;
                    break;
            }
        }

        return undefined;
    };

    // Get list of sections taught by an instructor
    this.getInstructorSections = function getInstructorSections(name) {
        name = name.toUpperCase();

        let l = 0;
        let r = this.instructors.length - 1;

        while (l <= r) {
            const m = Math.floor((l + r) / 2);
            const instructor = this.instructors[m];
            const nameUpperCase = instructor.name.toUpperCase();

            switch (name.localeCompare(nameUpperCase)) {
                case -1:
                    r = m - 1;
                    break;
                case 0:
                    const sections = instructor.sectionIdxs.map(
                        index => this.sections[index],
                        this
                    );
                    sections.sort(
                        function compare(a, b) {
                            if (a.subject != b.subject) {
                                return a.subject.localeCompare(b.subject);
                            }
                            if (a.course != b.course) {
                                return a.course - b.course;
                            }
                            return a.crn - b.crn;
                        }
                    );
                    return sections;
                case 1:
                    l = m + 1;
                    break;
            }
        }

        return undefined;
    };

    // Randomly pick a section that satisfies the callback
    // Default callback always returns true regardless of arguments
    this.getRandomSection = function getRandomSection(callback = () => true) {
        let section;
        // Keep picking section until callback returns true
        do {
            // Randomly select a section
            section = this.sections[Math.floor(Math.random() * this.sections.length)];
        } while (!callback(section));
        return this.copy(section);
    };

    // Get time stamp of when the data was generated
    this.getTimestamp = function getTimestamp() {
        return new Date(this.timestamp * 1000);
    };
});
