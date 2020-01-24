'use strict';

// Performance Service provides a way to measure performance
// The client should call start(), process, then call stop() to get a measure
app.service('performanceService', function performanceService($rootScope) {
    // Map to store time measurements
    // <key: string, value: [int]>
    this.records = new Map();

    // Map to store time stamps that are currently in measure
    // <key: string, value: Date>
    this.times = new Map();

    // Start timer and start measuring
    this.start = function (key) {
        // If the timer is already running, stop the timer
        if (this.times.has(key)) {
            this.stop(key);
        }

        // Start the timer
        this.times.set(key, new Date());
    };

    // Stop timer and record result
    this.stop = function (key) {
        // Mark time stamp immediately after entering the function
        const end = new Date();

        // Retrieve start time stamp
        const start = this.times.get(key);
        // If there is no start time stamp, do nothing
        if (start == undefined) {
            return;
        }

        // Calculate duration and add to record
        const duration = end.getTime() - start.getTime();
        this.add(key, duration);

        // Remove start time stamp
        this.times.delete(key);
    };

    // Add a measurement record
    this.add = function (key, duration) {
        // If there is no record, insert a new empty record
        if (!this.records.has(key)) {
            this.records.set(key, []);
        }

        const record = this.records.get(key);
        record.push(duration);
    };

    // Get the summary of a record
    this.get = function (key) {
        // If there is no record, insert a new empty record
        if (!this.records.has(key)) {
            this.records.set(key, []);
        }

        // Retrieve record and return summary
        const record = this.records.get(key);
        return {
            key: this.shortKey(key),
            min: Math.min(...record),
            max: Math.max(...record),
            // If record.length == 0, then avg = Infinity
            avg: record.reduce((accumulator, current) => accumulator + current) / record.length,
            sum: record.reduce((accumulator, current) => accumulator + current),
            n: record.length
        };
    };

    // Get summary of all records
    this.getAll = function () {
        const all = [];
        for (const [key, record] of this.records) {
            all.push(this.get(key));
        }
        return all;
    };

    // Obfuscator of keys, makes it look cool
    this.shortKey = function (name) {
        // Use regex to cut out: words in lowerCamelCase or HigherCamelCase, numbers, and symbols
        // Then take out the first char of each segment and join into a new string
        return name.match(/[a-zA-Z][a-z]*|\d+|[\W_]/g).map(segment => segment[0]).join('');
    }

    $rootScope.$broadcast('serviceReady', this.constructor.name);
});
