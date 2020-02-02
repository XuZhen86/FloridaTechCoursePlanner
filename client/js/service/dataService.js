'use strict';

/**
 * Data Service provides course data to clients.
 * @module dataService
 * @requires performanceService
 */
app.service('dataService', function dataService($rootScope, $http, performanceService) {
    /**
     * Flag to indicate if internal data source is ready.
     * @type {boolean}
     * @private
     */
    this.isReady = false;

    /**
     * List of all subjects.
     * @type {Subject[]}
     * @private
     */
    this.subjects = [];

    /**
     * List of all courses.
     * @type {Course[]}
     * @private
     */
    this.courses = [];

    /**
     * List of all sections.
     * @type {Section[]}
     * @private
     */
    this.sections = [];

    /**
     * List of all instructors.
     * @type {Instructor[]}
     * @private
     */
    this.instructors = [];

    /**
     * Timestamp of when the data was generated. Milliseconds since epoch.
     * @type {number}
     * @private
     */
    this.timestamp = 0;

    // Start performance measurement
    performanceService.start('dataService.$http.get()');
    // Download source data
    $http.get('/client/data/data.json').then(
        // If everything goes well, install the data and broadcast success message
        function success(response) {
            Object.assign(this, response.data);
            console.log(this);
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

    /**
     * Create a deep copy of an object using JSON.stringify() and JSON.parse().
     * @param {Object} obj Source object.
     * @returns {Object} A new object.
     * @private
     */
    this.copy = function copy(obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    /**
     * Get a list of available subjects.
     * @returns {Section[]} List of subject objects.
     */
    this.getSubjects = function getSubjects() {
        return this.copy(this.subjects);
    };

    /**
     * Get a subject object from the given subject name.
     * @param {string} subjectKey Name of the subject. E.g. CSE, ECE, HUM.
     * @returns {Subject} Subject object.
     */
    this.getSubject = function getSubject(subjectKey) {
        const subject = this.subjects.find(
            subject => subject.subject == subjectKey,
            this
        );
        return this.copy(subject);
    };

    /**
     * Get a list of courses under specific subject.
     * @param {string} subjectKey Name of the subject. E.g. CSE, ECE, HUM.
     * @returns {Course[]} List of course objects.
     */
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

    /**
     * Get a course object from the given subject name and course number.
     * @param {string} subjectKey Name of the subject. E.g. CSE, ECE, HUM.
     * @param {number} courseKey Course number of the course. E.g. 1001, 1502, 4130.
     * @returns {Course} Course object.
     */
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

    /**
     * Get a list of section objects from the given subject name and course number.
     * @param {string} subjectKey Name of the subject. E.g. CSE, ECE, HUM.
     * @param {number} courseKey Course number of the course. E.g. 1001, 1502, 4130.
     * @returns {Section[]} List of section objects.
     */
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

    /**
     * Get a list of section CRNs from the given subject name and course number.
     * @param {string} subjectKey Name of the subject. E.g. CSE, ECE, HUM.
     * @param {number} courseKey Course number of the course. E.g. 1001, 1502, 4130.
     * @returns {number[]} List of section CRNs.
     */
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

    /**
     * Get a section object from the given CRN.
     * The operation is optimized with binary search.
     * @param {number} crn CRN of the section. E.g. 17364, 23716, 26655.
     * @returns {Section|undefined} Section object.
     */
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

    /**
     * Get a list of all section objects.
     * @returns {Section[]} List of all section objects.
     */
    this.getAllSections = function getAllSections() {
        return this.copy(this.sections);
    };

    /**
     * Get an instructor object from given instructor name.
     * The operation is optimized with binary search.
     * @param {string} name Instructor name.
     * @returns {Instructor|undefined} Instructor object.
     */
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

    /**
     * Get a list of section objects under given instructor name.
     * The operation is optimized with binary search.
     * @param {string} name Instructor name.
     * @returns {Section[]|undefined} List of section objects.
     */
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

    /**
     * Randomly select a section that satisfies the callback function.
     * @param {function(section): boolean} [callback] Callback function that judges the selection.
     * @returns {Section} Section object.
     */
    this.getRandomSection = function getRandomSection(callback = () => true) {
        let section;
        // Keep picking section until callback returns true
        do {
            // Randomly select a section
            section = this.sections[Math.floor(Math.random() * this.sections.length)];
        } while (!callback(section));
        return this.copy(section);
    };

    /**
     * Get the timestamp of when the data was generated.
     * @returns {Date} Date object initialized with timestamp.
     */
    this.getTimestamp = function getTimestamp() {
        return new Date(this.timestamp * 1000);
    };
});
