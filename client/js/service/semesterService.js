'use strict';

app.service('semesterService', function semesterService($rootScope, dataService) {
    // Selected sections
    this.sections = [];
    // Temporary shown sections
    this.tempSections = [];

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
                const sections = this.sections.concat(this.tempSections);
                $rootScope.$broadcast('semesterService.updateSections', sections);
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

        for (const section of sections) {
            if (this.isSectionConflict(section.crn)) {
                return true;
            }
        }

        return false;
    };
});
