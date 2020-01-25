'use strict';

app.service('semesterService', function semesterService($rootScope, dataService, localStorageService) {
    // Selected sections
    this.sections = [];
    // Temporary shown sections
    this.tempSections = [];
    // Block out events
    this.blockOuts = [];

    // On successful retrieving the data, restore the session
    $rootScope.$on('dataService.init.success', function success() {
        const sectionCrns = localStorageService.get('semesterService.sections', []);
        const tempSectionCrns = localStorageService.get('semesterService.tempSections', []);
        const blockOuts = localStorageService.get('semesterService.blockOuts', []);

        this.sections = sectionCrns.map(
            crn => dataService.getSection(crn)
        );
        this.tempSections = tempSectionCrns.map(
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

    // Move events to current week
    // This func modifies the week number only
    // TODO: This func may not be correct
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

    // Add section with CRN to sections
    // If section is already added, remove it instead
    this.addSection = function addSection(crn, removeIfAdded = true) {
        // If this section is already added, remove it and exit
        if (removeIfAdded && this.isSectionAdded(crn)) {
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

    // Clear all sections
    this.clearSections = function clearSections() {
        this.sections = [];
        this.broadcastSections();
    };

    // Clear all block outs
    this.clearBlockOuts = function clearBlockOuts() {
        this.blockOuts = [];
        this.broadcastSections();
    };

    // Add section as temporary shown
    // Used by visualize the position on calendar of a section
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

    // Remove section as temporary shown
    // Used by visualize the position on calendar of a section
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

    // Remove all sections within a course
    this.removeCourse = function removeCourse(subject, course) {
        this.sections = this.sections.filter(
            section => !(section.subject == subject && section.course == course)
        );

        this.broadcastSections();
    };

    // Add block out event
    // Each event comes with a simple pre-generated unique id
    this.addBlockOut = function addBlockOut(text, start, end) {
        this.blockOuts.push({
            text: text,
            start: start,
            end: end,
            id: Math.random().toString(36)
        });

        this.broadcastSections();
    };

    // Remove block out event
    // If the id does not exist, do nothing
    this.removeBlockOut = function removeBlockOut(id) {
        this.blockOuts = this.blockOuts.filter(blockOut => blockOut.id != id);

        this.broadcastSections();
    };

    // Send the combined array of sections
    // Each call to this func will have a cool down to prevent lagging when spam calling this func
    // If this func is called within the cool down since last call, last call will be ignored and the timer restarts for the new call
    // Ignore timeout by setting 'now' to true
    this.broadcastSections = function (now = false) {
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
                    'semesterService.tempSections',
                    tempSections.map(section => section.crn)
                );
                localStorageService.set(
                    'semesterService.blockOuts',
                    blockOuts
                );
            }.bind(this),
            (now ? 0 : 100)   // If send now, set timeout to 0ms. Otherwise set to 100ms
        );
    };
    this.broadcastSectionsTimeout = setTimeout(() => { }, 0);    // Initialize timeout variable using an empty function

    // If a section with CRN is already in the sections list
    this.isSectionAdded = function isSectionAdded(crn) {
        return this.sections.findIndex(section => section.crn == crn) != -1;
    };

    // If a course is already in the sections list
    this.isCourseAdded = function isCourseAdded(subject, course) {
        return -1 != this.sections.findIndex(
            section => section.subject == subject && section.course == course
        );
    };

    // Cache the result of section conflict
    this.sectionConflictCache = {};

    // Get the result of previous calculation
    // If there is no record, return undefined
    // Otherwise return true/false
    this.sectionConflictCacheGet = function sectionConflictCacheGet(crn1, crn2) {
        // Merge 2 CRNs into 1 int. CRNs are expected to be exactly 5 digits
        const crnPair = Math.min(crn1, crn2) * 100000 + Math.max(crn1, crn2);
        return this.sectionConflictCache[crnPair];
    };

    // Set the result of calculation
    this.sectionConflictCacheSet = function sectionConflictCacheSet(crn1, crn2, isConflict) {
        // Merge 2 CRNs into 1 int. CRNs are expected to be exactly 5 digits
        const crnPair = Math.min(crn1, crn2) * 100000 + Math.max(crn1, crn2);
        this.sectionConflictCache[crnPair] = isConflict;
    };

    // Detect if section with CRN conflicts with any of the added sections
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

    // If all sections of a course conflict with any of the added sections
    this.isCourseConflict = function isCourseConflict(subject, course) {
        const sectionCrns = dataService.getSectionCrns(subject, course);
        const result = sectionCrns.every(crn => this.isSectionConflict(crn));
        return result;
    };

    $rootScope.$broadcast('serviceReady', this.constructor.name);
});
