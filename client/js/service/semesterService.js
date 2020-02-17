'use strict';

/**
 * Semester Service provides centralized processing for semester planner.
 * @class
 * @example
app.service('semesterService', [
    '$rootScope',
    'dataService',
    'localStorageService',
    SemesterService
]);
 */
class SemesterService {
    /**
     * @param {object} $rootScope {@link https://docs.angularjs.org/api/ng/service/$rootScope}
     * @param {DataService} dataService
     * @param {LocalStorageService} localStorageService
     */
    constructor($rootScope, dataService, localStorageService) {
        this.$rootScope = $rootScope;
        this.dataService = dataService;
        this.localStorageService = localStorageService;

        /**
         * List of selected section objects.
         * @type {Section[]}
         * @private
         */
        this.sections = [];

        /**
         * List of temporarily selected section objects.
         * Usually used to visualize section conflicts.
         * @type {Section[]}
         * @private
         */
        this.tempSections = [];

        /**
         * List of block out events.
         * @type {BlockOutEvent[]}
         * @private
         */
        this.blockOuts = [];

        /**
         * Variable used to track calls to setTimeout() and clearTimeout().
         * @type {number}
         * @private
         * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout}
         */
        this.broadcastSectionsTimeout = setTimeout(() => { }, 0);    // Initialize timeout variable using an empty function

        /**
         * The Object used to cache the result of section conflict test results.
         * Assuming CRNs are at most 5 digits long.
         * The key is a concatenation of the two CRNs, with the smaller CRN in the front.
         * E.g. 12345 and 23456 result in 1234523456, 90922 and 43244 result in 4324490922.
         * The value is a boolean. ```true``` means the two CRNs conflict, ```false``` means the two CRNs do not conflict.
         * E.g. ```1234523456 => true``` means 12345 and 23456 conflict, ```4324490922 => false``` means 90922 and 43244 do not conflict.
         * @type {object}
         * @private
         */
        this.sectionConflictCache = {};

        // Restore session on successful downloading data.
        // Using .bind(this) to ensure correct this pointer
        $rootScope.$on('DataService#initSuccess', this.restoreSession.bind(this));
    }

    /**
     * Restore session on successful downloading data.
     * @param {object} event Event object supplied by AngularJS
     * @private
     * @listens DataService#initSuccess
     * @example semesterService.restoreSession();
     * @example $rootScope.$on('DataService#initSuccess', this.restoreSession.bind(this));
     */
    restoreSession(event) {
        const sectionCrns = this.localStorageService.get('semesterService.sections', []);
        const blockOuts = this.localStorageService.get('semesterService.blockOuts', []);

        // Convert CRN to sections. There could be undefined sections if CRN does not exist.
        this.sections = sectionCrns.map(
            crn => this.dataService.getSection(crn)
        );
        // Ignore sections from other semesters.
        this.sections = this.sections.filter(
            section => section != undefined
        );
        // Ignore block outs from other weeks to keep block outs list free of old data.
        this.blockOuts = blockOuts.filter(
            function isInSameWeek(blockOut) {
                const now = new Date();
                const nowTimeString = sprintf(
                    '%04d-%02d-%02dT%02d:%02d:%02d',
                    now.getFullYear(),
                    now.getMonth() + 1,
                    now.getDate(),
                    now.getHours(),
                    now.getMinutes(),
                    now.getSeconds()
                );

                const nWeeks0 = this.getNumberOfWeek(blockOut.start);
                const nWeeks1 = this.getNumberOfWeek(nowTimeString);

                return nWeeks0 == nWeeks1;
            }.bind(this)
        );

        this.broadcastSections();
    }

    /**
     * Calculate number of week based on time string
     * @param {string} timeString Existing time string of the event.
     * @returns {string} Modified time string of the event.
     * @private
     * @see {@link https://gist.github.com/IamSilviu/5899269#gistcomment-2773524}
     */
    getNumberOfWeek(timeString) {
        // Restore original date
        const date = new Date();
        date.setFullYear(
            parseInt(timeString.slice(0, 4)),
            parseInt(timeString.slice(5, 7)) - 1,
            parseInt(timeString.slice(8, 10))
        );
        date.setHours(
            parseInt(timeString.slice(11, 13)),
            parseInt(timeString.slice(14, 16)),
            parseInt(timeString.slice(17, 19)),
            0
        );

        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    /**
     * Add a section to selected sections list.
     * If the section is already added, remove it instead.
     * @param {number} crn The CRN of the section to be added.
     * @throws {"TypeError: null is not an object (evaluating 'section.crn')"} If CRN does not exist.
     * @example semesterService.addSection(12345);
     */
    addSection(crn) {
        // If this section is already added, remove it and exit
        if (this.isSectionAdded(crn)) {
            this.removeSection(crn);
            return;
        }

        // Otherwise remove it from temp sections add it to sections
        // Remove it from temp sections to prevent a visual glitch that the same section is shown twice
        // The glitch can be triggered when click a section then not moving the mouse to another section
        this.removeTempSection(crn);

        // Add it to sections
        const section = this.dataService.getSection(crn);
        this.sections.push(section);

        this.broadcastSections();
    }

    /**
     * Remove a section from selected list.
     * If the section is not added or does not exist, do nothing.
     * @param {number} crn The CRN of the section to be removed.
     * @example semesterService.removeSection(12345);
     */
    removeSection(crn) {
        // If this section is not added, no nothing and exit
        const index = this.sections.findIndex(section => section.crn == crn);
        if (index == -1) {
            return;
        }

        // Otherwise remove this section
        this.sections.splice(index, 1);

        this.broadcastSections();
    }

    /**
     * Clear all selected sections.
     * @example semesterService.clearSections();
     */
    clearSections() {
        this.sections = [];
        this.broadcastSections();
    }

    /**
     * Clear all block outs.
     * @example semesterService.clearBlockOuts();
     */
    clearBlockOuts() {
        this.blockOuts = [];
        this.broadcastSections();
    }

    /**
     * Add temporarily shown section.
     * Usually used to visualize section conflicts.
     * If a section is already added, do nothing.
     * @param {number} crn The CRN of the section to be temporarily shown.
     * @throws {"null is not an object (evaluating 'section.times')"} If CRN does not exist.
     * @example semesterService.addTempSection(12345);
     */
    addTempSection(crn) {
        // If this section is already added, do nothing and exit
        // Checking both sections and tempSections
        if (this.tempSections.findIndex(section => section.crn == crn) != -1 || this.isSectionAdded(crn)) {
            return;
        }

        // Otherwise add it to sections
        const section = this.dataService.getSection(crn);
        this.tempSections.push(section);

        this.broadcastSections();
    }

    /**
     * Remove temporarily shown section.
     * Usually used to visualize section conflicts.
     * If a section is not added or does not exist, do nothing.
     * @param {number} crn The CRN of the section to be removed.
     * @example semesterService.removeTempSection(12345);
     */
    removeTempSection(crn) {
        // If this section was not added, no nothing and exit
        // No need to check sections
        const index = this.tempSections.findIndex(section => section.crn == crn);
        if (index == -1) {
            return;
        }

        // Otherwise remove this section
        this.tempSections.splice(index, 1);

        this.broadcastSections();
    }

    /**
     * Remove all added sections under a course.
     * Do nothing if subject or course does not exist.
     * @param {string} subject Name of the subject. E.g. CSE, ECE, HUM.
     * @param {number} course Course number of the course. E.g. 1001, 1502, 4130.
     * @example semesterService.removeCourse('CSE', 1001);
     */
    removeCourse(subject, course) {
        this.sections = this.sections.filter(
            section => !(section.subject == subject && section.course == course)
        );

        this.broadcastSections();
    }

    /**
     * Add a block out event with title, start time, and end time.
     * This function automatically generates a simple unique id for each event added.
     * Start time and end time must be in format ```2010-01-01T00:00:00```
     * @param {string} text Title of the event. Usually comes from user input.
     * @param {string} start Start time of the event. Usually generated from sprintf().
     * @param {string} end End time of the event. Usually generated from sprintf().
     * @throws {"Invalid string format (use '2010-01-01' or '2010-01-01T00:00:00'): ???"} If start time or end time format is incorrect.
     * @example semesterService.addBlockOut('Block out event', '2010-01-01T00:00:00', '2010-01-01T01:00:00');
     */
    addBlockOut(text, start, end) {
        this.blockOuts.push({
            text: text,
            start: start,
            end: end,
            id: Math.random().toString(36)
        });

        this.broadcastSections();
    }

    /**
     * Remove block out event.
     * If the event id does not exist, do nothing.
     * @param {string} id Event unique id.
     * @example semesterService.removeBlockOut(blockOuts[0].id);
     */
    removeBlockOut(id) {
        this.blockOuts = this.blockOuts.filter(blockOut => blockOut.id != id);

        this.broadcastSections();
    }

    /**
     * Send array of selected sections, array of temporarily shown sections, and block out events.
     * After calling this function, there will be a cool down period before the data was actually sent out.
     * If this function is called again within the cool down period, the previous call is canceled and the cool down restarts.
     * The cool down mechanism prevents lagging caused by spam calling the function.
     * This function can also be used to undo any user modifications on calendar by simply resend the events to overwrite modified events.
     * @param {boolean} [sendNow = false] Ignore cool down and send immediately.
     * @emits SemesterService#updateSections
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout}
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/clearTimeout}
     * @example semesterService.broadcastSections();
     */
    broadcastSections(sendNow = false) {
        // Ignore last call
        clearTimeout(this.broadcastSectionsTimeout);
        // Schedule a new call
        this.broadcastSectionsTimeout = setTimeout(
            function broadcast() {
                const sections = JSON.parse(JSON.stringify(this.sections));
                const tempSections = JSON.parse(JSON.stringify(this.tempSections));
                const blockOuts = JSON.parse(JSON.stringify(this.blockOuts));

                this.$rootScope.$broadcast(
                    'SemesterService#updateSections',
                    sections,
                    tempSections,
                    blockOuts
                );

                // Save a copy of CRNs in local storage to resume the work
                this.localStorageService.set(
                    'semesterService.sections',
                    sections.map(section => section.crn)
                );
                this.localStorageService.set(
                    'semesterService.blockOuts',
                    blockOuts
                );
            }.bind(this),
            (sendNow ? 0 : 100)   // If send now, set timeout to 0ms. Otherwise set to 100ms
        );
    }

    /**
     * Test if a section is in the selected sections list.
     * If the CRN does not exist, return false.
     * @param {number} crn CRN of the section.
     * @returns {boolean} Is the section in the selected sections list.
     * @example const isAdded = semesterService.isSectionAdded(12345);
     */
    isSectionAdded(crn) {
        return this.sections.findIndex(section => section.crn == crn) != -1;
    }

    /**
     * Test if any section of a course is in the selected sections list.
     * If subject or course does not exist, return false.
     * @param {string} subject Name of the subject. E.g. CSE, ECE, HUM.
     * @param {number} course Course number of the course. E.g. 1001, 1502, 4130.
     * @returns {boolean}
     * @example const isAdded = semesterService.isCourseAdded('CSE', 1001);
     */
    isCourseAdded(subject, course) {
        return -1 != this.sections.findIndex(
            section => section.subject == subject && section.course == course
        );
    }

    /**
     * Get the cached result of section conflict test.
     * @param {number} crn1 The first CRN.
     * @param {number} crn2 The second CRN.
     * @returns {boolean} If there is a record.
     * @returns {undefined} If there is no record.
     * @private
     * @example const isConflict = semesterService.sectionConflictCacheGet(12345, 67890);
     */
    sectionConflictCacheGet(crn1, crn2) {
        // Merge 2 CRNs into 1 int. CRNs are expected to be exactly 5 digits
        const crnPair = Math.min(crn1, crn2) * 100000 + Math.max(crn1, crn2);
        return this.sectionConflictCache[crnPair];
    }

    /**
     * Add a result of section conflict test to cache.
     * @param {number} crn1 The first CRN.
     * @param {number} crn2 The second CRN.
     * @param {boolean} isConflict If the two sections conflict.
     * @private
     * @example semesterService.sectionConflictCacheSet(12345, 67890, true);
     */
    sectionConflictCacheSet(crn1, crn2, isConflict) {
        // Merge 2 CRNs into 1 int. CRNs are expected to be exactly 5 digits
        const crnPair = Math.min(crn1, crn2) * 100000 + Math.max(crn1, crn2);
        this.sectionConflictCache[crnPair] = isConflict;
    }

    /**
     * Test if specified section conflicts with any of the selected sections.
     * Usually used in styling sections. If the section conflicts, it is colored red.
     * @param {number} crn CRN of the section to be tested.
     * @returns {boolean}
     * @throws {"TypeError: undefined is not an object (evaluating 'section.days')"} If CRN does not exist.
     * @example const isConflict = semesterService.isSectionConflict(12345);
     */
    isSectionConflict(crn) {
        const dayChars = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
        const section = this.dataService.getSection(crn);

        for (const addedSection of this.sections) {
            // Read from cache
            const isConflict = this.sectionConflictCacheGet(crn, addedSection.crn);
            // If there is a result, avoid calculation
            if (isConflict == true) {
                return true;
            } else if (isConflict == false) {
                continue;
            }

            // Otherwise do actual calculation and cache the result
            for (const dayChar of dayChars) {
                const times = [];

                for (const [i, days] of section.days.entries()) {
                    for (const day of days) {
                        if (day == dayChar) {
                            times.push(section.times[i]);
                        }
                    }
                }
                for (const [i, days] of addedSection.days.entries()) {
                    for (const day of days) {
                        if (day == dayChar) {
                            times.push(addedSection.times[i]);
                        }
                    }
                }

                times.sort((t1, t2) => t1[0] - t2[0]);

                for (let i = 1; i < times.length; i++) {
                    if (times[i - 1][1] >= times[i][0]) {
                        // Cache result
                        this.sectionConflictCacheSet(crn, addedSection.crn, true);
                        return true;
                    }
                }
            }

            // Cache result
            this.sectionConflictCacheSet(crn, addedSection.crn, false);
        }

        return false;
    }

    /**
     * Test if all sections under a course conflict with any of the selected sections.
     * Usually used in styling courses. If all sections of this course are colored red, this course is colored red as well.
     * @param {string} subject Name of the subject. E.g. CSE, ECE, HUM.
     * @param {number} course Course number of the course. E.g. 1001, 1502, 4130.
     * @returns {boolean}
     * @throws {"TypeError: undefined is not an object (evaluating 'subject.courseIdxs')"} If subject does not exist.
     * @throws {"TypeError: undefined is not an object (evaluating 'this.courses[courseIndex].sectionIdxs')"} If course number does not exist.
     * @example const isConflict = semesterService.isCourseConflict('CSE', 1001);
     */
    isCourseConflict(subject, course) {
        const sectionCrns = this.dataService.getSectionCrns(subject, course);
        const result = sectionCrns.every(crn => this.isSectionConflict(crn));
        return result;
    }
}

app.service('semesterService', [
    '$rootScope',
    'dataService',
    'localStorageService',
    SemesterService
]);

/**
 * Object that stores information about a block out event.
 * @typedef {Object} BlockOutEvent
 * @property {string} text Title of the event. Usually comes from user input.
 * @property {string} start Start time of the event. Usually generated from sprintf().
 * @property {string} end End time of the event. Usually generated from sprintf().
 * @property {string} id Unique id of the event. Usually generated from Math.random().toString(36).
 */

/**
 * Semester Service Update Sections Event.
 * This event is used whenever the calendar needs to show updated events.
 * @event SemesterService#updateSections
 * @property {Section[]} sections List of selected sections.
 * @property {Section[]} tempSections List of temporarily selected sections.
 * @property {BlockOutEvent[]} blockOuts List of block out events.
 * @example $rootScope.$broadcast('SemesterService#updateSections', sections, tempSections, blockOuts);
 * @example $scope.$on('SemesterService#updateSections', (event, sections, tempSections, blockOuts) => { });
 */
