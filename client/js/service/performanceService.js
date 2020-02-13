'use strict';

/**
 * Performance Service provides a way to measure performance.
 * The client should call start(), do time consuming operations, then call stop() to record a performance measurement.
 * Notice the measurements are not precise, as the unit of measurements are milliseconds.
 * @class
 * @example
app.service('performanceService', [
    '$rootScope',
    PerformanceService
]);
 */
class PerformanceService {
    /**
     * @param {object} $rootScope {@link https://docs.angularjs.org/api/ng/service/$rootScope}
     */
    constructor($rootScope) {
        this.$rootScope = $rootScope;

        /**
         * The map object to store metrics measurements.
         * @type {Map<string, number>}
         * @private
         */
        this.records = new Map();

        /**
         * The map to store time stamps of metrics that are currently measuring.
         * @type {Map<string, Date>}
         * @private
         */
        this.timestamps = new Map();
    }

    /**
     * Start the timer of a metrics with key.
     * If a measurement is running, it is stopped and a new measurement is started.
     * @param {string} key Name of the metrics.
     * @example performanceService.start('My time consuming operation');
     */
    start(key) {
        // If the timer is already running, stop the timer
        if (this.timestamps.has(key)) {
            this.stop(key);
        }

        // Start the timer
        this.timestamps.set(key, new Date());
    }

    /**
     * Stop the timer of a metrics and save the result.
     * @param {string} key Name of the metrics.
     * @example performanceService.stop('My time consuming operation');
     */
    stop(key) {
        // Mark time stamp immediately after entering the function
        const end = new Date();

        // Retrieve start time stamp
        const start = this.timestamps.get(key);
        // If there is no start time stamp, do nothing
        if (start == undefined) {
            return;
        }

        // Calculate duration and add to record
        const duration = end.getTime() - start.getTime();
        this.add(key, duration);

        // Remove start time stamp
        this.timestamps.delete(key);
    }

    /**
     * Add a metrics measurement result.
     * @param {string} key The name of the metrics.
     * @param {number} duration How long in ms the operation took.
     * @private
     * @example performanceService.add('My time consuming operation', 21);
     */
    add(key, duration) {
        // If there is no record, insert a new empty record
        if (!this.records.has(key)) {
            this.records.set(key, []);
        }

        const record = this.records.get(key);
        record.push(duration);
    }

    /**
     * Get a metrics measurement summary.
     * @param {string} key The name of the metrics.
     * @returns {PerformanceSummary} The object containing measurement information.
     * @example const summary = performanceService.get('My time consuming operation');
     */
    get(key) {
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
    }

    /**
     * Get summaries of all metrics measurements.
     * @returns {PerformanceSummary[]} The array of measurements.
     * @example const summaries = performanceService.getAll();
     */
    getAll() {
        const all = [];
        for (const [key, record] of this.records) {
            all.push(this.get(key));
        }
        return all;
    }

    /**
     * Obfuscate the key string, making it look cool.
     * This function uses regex ```/[a-zA-Z][a-z]*|\d+|[\W_]/g``` to match individual words, numbers, and symbols, then reassemble the first letters into a new string.
     * @param {string} key The name of the metrics.
     * @returns {string} The shortened name of the metrics.
     * @private
     * @example const shortKey = performanceService.shortKey('my.timeConsumingOperation()'); shortKey == 'm.tCO()';
     */
    shortKey(key) {
        // Use regex to cut out: words in lowerCamelCase or HigherCamelCase, numbers, and symbols
        // Then take out the first char of each segment and join into a new string
        return key.match(/[a-zA-Z][a-z]*|\d+|[\W_]/g).map(segment => segment[0]).join('');
    }
}

app.service('performanceService', [
    '$rootScope',
    PerformanceService
]);

/**
 * Object that stores performance measurement summary.
 * @typedef {object} PerformanceSummary
 * @property {string} key Name of the metrics.
 * @property {number} min Minimum time used.
 * @property {number} max Maximum time used.
 * @property {number} avg Average time used.
 * @property {number} sum Total time used.
 * @property {number} n Number of measurements.
 */
