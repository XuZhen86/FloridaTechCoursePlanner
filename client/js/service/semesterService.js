'use strict';

/**
 * Semester Service provides centralized processing for semester planner.
 * @module semesterService
 * @requires dataService
 * @requires localStorageService
 */
app.service('semesterService', function semesterService($rootScope, dataService, localStorageService) {
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

    // On successful retrieving the data, restore the session
    $rootScope.$on('dataService.init.success', function success() {
        const sectionCrns = localStorageService.get('semesterService.sections', []);
        const blockOuts = localStorageService.get('semesterService.blockOuts', []);

        this.sections = sectionCrns.map(
            crn => dataService.getSection(crn)
        );
        this.blockOuts = blockOuts.map(
            // If user did not use the program for weeks
            // the date of block out events should be updated to be within the current week
            function processBlockOut(blockOut) {
                blockOut.start = this.moveToCurrentWeek(blockOut.start);
                blockOut.end = this.moveToCurrentWeek(blockOut.end);
                return blockOut;
            }.bind(this)
        );

        this.broadcastSections();
    }.bind(this));

    /**
     * Move events from previous weeks to current week by modifying the week number.
     * @param {string} timeString Existing time string of the event.
     * @returns {string} Modified time string of the event.
     * @todo Rewrite the calculation. The current calculation may sometimes be incorrect.
     * @private
     */
    this.moveToCurrentWeek = function moveToCurrentWeek(timeString) {
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

        const now = new Date();

        // Keep adding week until the two dates are in the same week
        while (now.getDate() - now.getDay() != date.getDate() - date.getDay()) {
            date.setDate(date.getDate() + 7);
        }

        const newTimeString = sprintf(
            '%04d-%02d-%02dT%02d:%02d:%02d',
            date.getFullYear(),
            date.getMonth() + 1,
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds()
        );

        return newTimeString;
    };

    /**
     * Add a section to selected list.
     * If the section is already added, remove it instead.
     * @param {number} crn The CRN of the section to be added.
     * @returns {void}
     */
    this.addSection = function addSection(crn) {
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
        const section = dataService.getSection(crn);
        this.sections.push(section);

        this.broadcastSections();
    };

    // Remove section with CRN from sections
    /**
     * Remove a section from selected list.
     * If the section is not added, do nothing.
     * @param {number} crn The CRN of the section to be removed.
     * @returns {void}
     */
    this.removeSection = function removeSection(crn) {
        // If this section is not added, no nothing and exit
        const index = this.sections.findIndex(section => section.crn == crn);
        if (index == -1) {
            return;
        }

        // Otherwise remove this section
        this.sections.splice(index, 1);

        this.broadcastSections();
    };

    /**
     * Clear all selected sections.
     * @returns {void}
     */
    this.clearSections = function clearSections() {
        this.sections = [];
        this.broadcastSections();
    };

    /**
     * Clear all block outs.
     * @returns {void}
     */
    this.clearBlockOuts = function clearBlockOuts() {
        this.blockOuts = [];
        this.broadcastSections();
    };

    /**
     * Add temporarily shown section.
     * Usually used to visualize section conflicts.
     * If a section is already added, do nothing.
     * @param {number} crn The CRN of the section to be temporarily shown.
     * @returns {void}
     */
    this.addTempSection = function addTempSection(crn) {
        // If this section is already added, do nothing and exit
        // Checking both sections and tempSections
        if (this.tempSections.findIndex(section => section.crn == crn) != -1 || this.isSectionAdded(crn)) {
            return;
        }

        // Otherwise add it to sections
        const section = dataService.getSection(crn);
        this.tempSections.push(section);

        this.broadcastSections();
    };

    /**
     * Remove temporarily shown section.
     * Usually used to visualize section conflicts.
     * If a section is not added, do nothing.
     * @param {number} crn The CRN of the section to be removed.
     * @returns {void}
     */
    this.removeTempSection = function removeTempSection(crn) {
        // If this section was not added, no nothing and exit
        // No need to check sections
        const index = this.tempSections.findIndex(section => section.crn == crn);
        if (index == -1) {
            return;
        }

        // Otherwise remove this section
        this.tempSections.splice(index, 1);

        this.broadcastSections();
    };

    /**
     * Remove all added sections under a course.
     * @param {string} subject Name of the subject. E.g. CSE, ECE, HUM.
     * @param {number} course Course number of the course. E.g. 1001, 1502, 4130.
     * @returns {void}
     */
    this.removeCourse = function removeCourse(subject, course) {
        this.sections = this.sections.filter(
            section => !(section.subject == subject && section.course == course)
        );

        this.broadcastSections();
    };

    /**
     * Add a block out event.
     * This function automatically generates a simple unique id for each event added.
     * @param {string} text Title of the event. Usually comes from user input.
     * @param {string} start Start time of the event. Usually generated from sprintf().
     * @param {string} end End time of the event. Usually generated from sprintf().
     * @returns {void}
     */
    this.addBlockOut = function addBlockOut(text, start, end) {
        this.blockOuts.push({
            text: text,
            start: start,
            end: end,
            id: Math.random().toString(36)
        });

        this.broadcastSections();
    };

    /**
     * Remove block out event.
     * If the event id does not exist, do nothing.
     * @param {string} id Event unique id.
     * @returns {void}
     */
    this.removeBlockOut = function removeBlockOut(id) {
        this.blockOuts = this.blockOuts.filter(blockOut => blockOut.id != id);

        this.broadcastSections();
    };

    /**
     * Send array of selected sections, array of temporarily shown sections, and block out events.
     * After calling this function, there will be a cool down period before the data was actually sent out.
     * If this function is called again within the cool down period, the previous call is canceled and the cool down restarts.
     * The cool down mechanism prevents lagging caused by spam calling the function.
     * @param {boolean} [sendNow = false] Ignore cool down and send immediately.
     * @returns {void}
     */
    this.broadcastSections = function (sendNow = false) {
        // Ignore last call
        clearTimeout(this.broadcastSectionsTimeout);
        // Schedule a new call
        this.broadcastSectionsTimeout = setTimeout(
            function broadcast() {
                const sections = JSON.parse(JSON.stringify(this.sections));
                const tempSections = JSON.parse(JSON.stringify(this.tempSections));
                const blockOuts = JSON.parse(JSON.stringify(this.blockOuts));

                $rootScope.$broadcast(
                    'semesterService.updateSections',
                    sections,
                    tempSections,
                    blockOuts
                );

                // Save a copy of CRNs in local storage to resume the work
                localStorageService.set(
                    'semesterService.sections',
                    sections.map(section => section.crn)
                );
                localStorageService.set(
                    'semesterService.blockOuts',
                    blockOuts
                );
            }.bind(this),
            (sendNow ? 0 : 100)   // If send now, set timeout to 0ms. Otherwise set to 100ms
        );
    };

    /**
     * Variable used to track calls to setTimeout() and clearTimeout().
     * @type {number}
     * @private
     */
    this.broadcastSectionsTimeout = setTimeout(() => { }, 0);    // Initialize timeout variable using an empty function

    /**
     * Test if a section is in the selected sections list.
     * @param {number} crn CRN of the section.
     * @returns {boolean}
     */
    this.isSectionAdded = function isSectionAdded(crn) {
        return this.sections.findIndex(section => section.crn == crn) != -1;
    };

    /**
     * Test if any section of a course is in the selected sections list.
     * @param {string} subject Name of the subject. E.g. CSE, ECE, HUM.
     * @param {number} course Course number of the course. E.g. 1001, 1502, 4130.
     * @returns {boolean}
     */
    this.isCourseAdded = function isCourseAdded(subject, course) {
        return -1 != this.sections.findIndex(
            section => section.subject == subject && section.course == course
        );
    };

    /**
     * The Object used to cache the result of section conflict test results.
     * Assuming CRNs are at most 5 digits long.
     * The key is a concatenation of the two CRNs, with the smaller CRN in the front.
     * E.g. 12345 and 23456 result in 1234523456, 90922 and 43244 result in 4324490922.
     * The value is a boolean. True means the two CRNs conflict, false means the two CRNs do not conflict.
     * E.g. 1234523456 => True means 12345 and 23456 conflict, 4324490922 => False means 90922 and 43244 do not conflict.
     * @type {Object}
     * @private
     */
    this.sectionConflictCache = {};

    /**
     * Get the cached result of section conflict test.
     * @param {number} crn1 The first CRN.
     * @param {number} crn2 The second CRN.
     * @returns {boolean|undefined} If there is a record, return boolean. Otherwise return undefined.
     * @private
     */
    this.sectionConflictCacheGet = function sectionConflictCacheGet(crn1, crn2) {
        // Merge 2 CRNs into 1 int. CRNs are expected to be exactly 5 digits
        const crnPair = Math.min(crn1, crn2) * 100000 + Math.max(crn1, crn2);
        return this.sectionConflictCache[crnPair];
    };

    /**
     * Add a result of section conflict test to cache.
     * @param {number} crn1 The first CRN.
     * @param {number} crn2 The second CRN.
     * @returns {void}
     * @private
     */
    this.sectionConflictCacheSet = function sectionConflictCacheSet(crn1, crn2, isConflict) {
        // Merge 2 CRNs into 1 int. CRNs are expected to be exactly 5 digits
        const crnPair = Math.min(crn1, crn2) * 100000 + Math.max(crn1, crn2);
        this.sectionConflictCache[crnPair] = isConflict;
    };

    /**
     * Test if specified section conflicts with any of the selected sections.
     * @param {number} crn CRN of the section to be tested.
     * @returns {boolean}
     */
    this.isSectionConflict = function isSectionConflict(crn) {
        const dayChars = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
        const section = dataService.getSection(crn);

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
    };

    /**
     * Test if all sections under a course conflict with any of the selected sections.
     * @param {string} subject Name of the subject. E.g. CSE, ECE, HUM.
     * @param {number} course Course number of the course. E.g. 1001, 1502, 4130.
     * @returns {boolean}
     */
    this.isCourseConflict = function isCourseConflict(subject, course) {
        const sectionCrns = dataService.getSectionCrns(subject, course);
        const result = sectionCrns.every(crn => this.isSectionConflict(crn));
        return result;
    };

    $rootScope.$broadcast('serviceReady', this.constructor.name);
});
