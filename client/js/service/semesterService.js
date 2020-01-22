'use strict';

app.service('semesterService', function semesterService($rootScope, dataService, localStorageService) {
    // Selected sections
    this.sections = [];
    // Temporary shown sections
    this.tempSections = [];
    // Block out events
    this.blockOuts = [];

    // On successful retrieving the data, restore the session
    $rootScope.$on('dataService.init.success', function () {
        const sectionCrns = localStorageService.get('semesterService.sections', []);
        const tempSectionCrns = localStorageService.get('semesterService.tempSections', []);
        const blockOuts = localStorageService.get('semesterService.blockOuts', []);

        this.sections = sectionCrns.map(crn => dataService.get('section', crn));
        this.tempSections = tempSectionCrns.map(crn => dataService.get('section', crn));
        this.blockOuts = blockOuts;

        this.broadcastSections();
    }.bind(this));

    // Add section with CRN to sections
    // If section is already added, remove it instead
    this.addSection = function (crn, removeIfAdded = true) {
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
        const section = dataService.get('section', crn);
        this.sections.push(section);
        this.broadcastSections();
    };

    // Remove section with CRN from sections
    this.removeSection = function (crn) {
        // If this section is not added, no nothing and exit
        const index = this.sections.findIndex(section => section.crn == crn);
        if (index == -1) {
            return;
        }

        // Otherwise remove this section
        this.sections.splice(index, 1);
        this.broadcastSections();
    }

    // Add section as temporary shown
    // Used by visualize the position on calendar of a section
    this.addTempSection = function (crn) {
        // If this section is already added, do nothing and exit
        // Checking both sections and tempSections
        if (this.tempSections.findIndex(section => section.crn == crn) != -1 || this.isSectionAdded(crn)) {
            return;
        }

        // Otherwise add it to sections
        const section = dataService.get('section', crn);
        this.tempSections.push(section);
        this.broadcastSections();
    };

    // Remove section as temporary shown
    // Used by visualize the position on calendar of a section
    this.removeTempSection = function (crn) {
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
    this.removeCourse = function (subject, course) {
        this.sections = this.sections.filter(
            function (section) {
                return !(section.subject == subject && section.course == course);
            }
        );
        this.broadcastSections();
    }

    // Add block out event
    // Each event comes with a simple pre-generated unique id
    this.addBlockOut = function (text, start, end) {
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
    this.removeBlockOut = function (id) {
        this.blockOuts = this.blockOuts.filter(
            function (blockOut) {
                return blockOut.id != id;
            }
        );
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
            function () {
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
                localStorageService.set('semesterService.sections', sections.map(section => section.crn));
                localStorageService.set('semesterService.tempSections', tempSections.map(section => section.crn));
                localStorageService.set('semesterService.blockOuts', blockOuts);
            }.bind(this),
            (now ? 0 : 100)   // If send now, set timeout to 0ms. Otherwise set to 100ms
        );
    };
    this.broadcastSectionsTimeout = setTimeout(() => {}, 0);    // Initialize timeout variable using an empty function

    // If a section with CRN is already in the sections list
    this.isSectionAdded = function (crn) {
        return this.sections.findIndex(section => section.crn == crn) != -1;
    };

    // If a course is already in the sections list
    this.isCourseAdded = function (subject, course) {
        return this.sections.findIndex(section => section.subject == subject && section.course == course) != -1;
    };

    // Detect if section with CRN conflicts with any of the added sections
    this.isSectionConflict = function (crn) {
        const dayChars = ['U', 'M', 'T', 'W', 'R', 'F', 'S'];
        const section = dataService.get('section', crn);

        for (const addedSection of this.sections) {
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
                    if (times[i - 1][1] >= times[i][0]) return true;
                }
            }
        }

        return false;
    };

    // If all sections of a course conflict with any of the added sections
    this.isCourseConflict = function (subject, course) {
        const sections = dataService.get('sections', subject, course);

        const result = sections.reduce(
            function (isAllConflict, section) {
                return isAllConflict && this.isSectionConflict(section.crn);
            }.bind(this),
            true
        );

        return result;
    };

    $rootScope.$broadcast('serviceReady', this.constructor.name);
});
