'use strict';

/**
 * Miscellaneous configurations and definitions.
 * @module app
 */
const app = angular.module('app', ['ngMaterial', 'ngMessages', 'daypilot', 'sprintf']);

// Config theme color
app.config(function ($mdThemingProvider) {
    $mdThemingProvider
        .theme('default')
        .primaryPalette('blue', { 'default': '600' });
});

// Config icons
app.config(function ($mdIconProvider) {
    // Info needed to register icons
    // [name, path]
    const icons = [
        ['alert', '/client/icon/alert.svg'],
        ['arrow:left', '/client/icon/arrow_left.svg'],
        ['arrow:right', '/client/icon/arrow_right.svg'],
        ['arrow:upperRight', '/client/icon/arrow_upperRight.svg'],
        ['check', '/client/icon/check.svg'],
        ['cross', '/client/icon/cross.svg'],
        ['download', '/client/icon/download.svg'],
        ['pdf', '/client/icon/pdf.svg'],
        ['plus', '/client/icon/plus.svg'],
        ['printer', '/client/icon/printer.svg']
    ];
    // Register icon names and icon files
    for (const icon of icons) {
        $mdIconProvider.icon(icon[0], icon[1]);
    }
});

// Type definitions
/**
 * Object that stores information about an instructor.
 * @typedef {Object} Instructor
 * @property {string} name Name of the instructor.
 * @property {number[]} sectionIdxs Indexes of the sections taught by the instructor. Used internally.
 */

/**
 * Object that stores information about a subject.
 * @typedef {Object} Subject
 * @property {number[]} courseIdxs Indexes of the courses under the subject. Used internally.
 * @property {string} subject Also called Prefix. E.g. CSE, ECE, HUM.
 * @property {string} title Full name of the subject. E.g. Computer Sciences.
 */

/**
 * Object that stores information about a course.
 * @typedef {Object} Course
 * @property {number} course Course number of the course. E.g. 1001, 1502, 4130.
 * @property {number[]} cr Lower and upper limit of credit hours.
 * @property {string} description Description of the course.
 * @property {string} subject Subject of the course. E.g. CSE, ECE, HUM.
 * @property {string[][]} tags List of pairs of tags. [0] = Short name. [1] = Full name.
 * @property {string} title Title of the course. E.g. Fund of Software Dev 1.
 */

/**
 * Object that stores information about a section.
 * @typedef {Object} Section
 * @property {number[]} cap Actual enroll and maximum enroll of the section.
 * @property {number} course Course number of the section. E.g. 1001, 1502, 4130.
 * @property {number[]} cr Lower and upper limit of credit hours.
 * @property {number} crn CRN of the section.
 * @property {string[]} days List of days the section is held on.
 * @property {string} description Description of the section.
 * @property {string} instructor Name of the instructor that teaches the section.
 * @property {string} note Special note of the section. Usually used in specific topic sections.
 * @property {string[][]} places List of pairs of places. [0] = Building. [1] = Room.
 * @property {string} section Section string of the section. Could contain alphabets.
 * @property {string} subject Subject of the section. E.g. CSE, ECE, HUM.
 * @property {string[][]} tags List of pairs of tags. [0] = Short name. [1] = Full name.
 * @property {number[][]} times List of pairs of times. [0] = Start time. [1] = End time.
 * @property {string} title Title of the section. E.g. Fund of Software Dev 1.
 */

/**
 * Object that stores information about a block out event.
 * @typedef {Object} BlockOutEvent
 * @property {string} text Title of the event. Usually comes from user input.
 * @property {string} start Start time of the event. Usually generated from sprintf().
 * @property {string} end End time of the event. Usually generated from sprintf().
 * @property {string} id Unique id of the event. Usually generated from Math.random().toString(36).
 */
