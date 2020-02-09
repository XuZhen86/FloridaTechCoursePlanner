'use strict';

/**
 * PDF Service generates various PDF files.
 * @class
 * @example app.service('pdfService', ['$rootScope', 'performanceService', 'dataService', PdfService]);
 */
class PdfService {
    /**
     * @param {object} $rootScope {@link https://docs.angularjs.org/api/ng/service/$rootScope}
     * @param {PerformanceService} performanceService
     * @param {DataService} dataService
     */
    constructor($rootScope, performanceService, dataService) {
        this.$rootScope = $rootScope;
        this.performanceService = performanceService;
        this.dataService = dataService;

        $rootScope.$broadcast('serviceReady', this.constructor.name);
    }

    /**
     * Generate registration form from a list of sections.
     * @param {Section[]} sections List of sections.
     * @returns {Array<Blob, string>} Bundle of Blob object that contains PDF file data and String object that contains PDF URL.
     * @example const [blob, blobUrl] = await pdfService.generateRegForm(sections);
     */
    async generateRegForm(sections) {
        this.performanceService.start('pdfService.generateRegForm');

        // Read PDF template
        const regFormBytes = await (await fetch('../forms/registration.pdf')).arrayBuffer();
        // Create PDF object
        const pdfDoc = await PDFLib.PDFDocument.load(regFormBytes);
        // Locate 1st page
        const page = pdfDoc.getPages()[0];

        // Section field name and field X position
        const xs = [
            ['crn', 50],
            ['subject', 100],
            ['course', 135],
            ['section', 188],
            ['title', 215],
            ['days', 440],
            ['times', 490],
            ['cr', 535]
        ];
        // Field Y position
        let y = 792 - 260;
        // Master string collecting everything.
        let string = '';

        for (const section of sections) {
            // For each field name and field X position
            for (const [field, x] of xs) {
                // Special processing for days
                if (field == 'days') {
                    // Display the day information in the same format as everything else if we can.
                    if (section.days.length == 1) {
                        string = string + `${section.days[0]}`;
                        page.drawText(
                            `${section.days[0]}`,
                            { x: x, y: y, size: 10 }
                        );
                        continue;
                    }
                    // Otherwise use special formatting, but only display a maximum of 3.
                    else if (section.days.length < 4) {
                        // For each day
                        for (const [i, day] of section.days.entries()) {
                            // The y pos and text size is different than general case
                            string = string + `${day}`;
                            page.drawText(
                                `${day}`,
                                { x: x, y: y + i * (20 / section.days.length), size: 6 }
                            );
                        }
                        continue;
                    }
                }

                // Special processing for times
                if (field == 'times') {
                    // Display the time information in the same size as everything else if we can.
                    if (section.times.length == 1) {
                        string = string + `${section.times[0][0]}-${section.times[0][1]}`;
                        page.drawText(
                            `${section.times[0][0]} -`,
                            { x: x, y: y + 8, size: 10 }
                        );
                        page.drawText(
                            `${section.times[0][1]}`,
                            { x: x, y: y, size: 10 }
                        );
                        continue;
                    }
                    // Otherwise use special formatting, but only display a maximum of 3.
                    else if (section.times.length < 4) {
                        // For each time
                        for (const [i, time] of section.times.entries()) {
                            // The y pos and text size is different than general case
                            string = string + `${time[0]} - ${time[1]}`;
                            page.drawText(
                                `${time[0]} - ${time[1]}`,
                                { x: x, y: y + i * (20 / section.days.length), size: 6 }
                            );
                        }
                        continue;
                    }
                }

                // Special processing for credit hours
                if (field == 'cr') {
                    const cr = section.cr;

                    // If the credit hour is definite, print credit hour
                    if (cr[0] == cr[1]) {
                        string = string + `${cr[0]}`;
                        page.drawText(
                            `${cr[0]}`,
                            { x: x, y: y, size: 10 }
                        );
                    }
                    // Otherwise leave it blank

                    continue;
                }

                // General processing
                string = string + `${section[field]}`;
                page.drawText(
                    `${section[field]}`,
                    { x: x, y: y, size: 10 }
                );
            }

            // Move to next line
            y -= 24;
        }

        // Add data file timestamp
        y = 792 - 440;
        const dataTimestamp = `${this.dataService.getTimestampNumber()}`;
        string = string + dataTimestamp;
        page.drawText(
            `// t1 = ${dataTimestamp}`,
            { x: 30, y: y, size: 7 }
        );

        // Add PDF timestamp
        y -= 7;
        const pdfTimestamp = `${(new Date()).getTime() / 1000}`;
        string = string + pdfTimestamp;
        page.drawText(
            `// t2 = ${pdfTimestamp}`,
            { x: 30, y: y, size: 7 }
        );

        // Add hash value
        // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
        y -= 7;
        const data = (new TextEncoder()).encode(string);
        const sha256Buffer = await crypto.subtle.digest('SHA-256', data);
        const sha256Array = Array.from(new Uint8Array(sha256Buffer));
        const sha256Hex = sha256Array.map(b => b.toString(16).padStart(2, '0')).join('');
        page.drawText(
            `// h = ${sha256Hex}`,
            { x: 30, y: y, size: 7 }
        );

        // Generate binary data and show on HTML
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);

        this.performanceService.stop('pdfService.generateRegForm');
        return [blob, blobUrl];
    }
}

app.service('pdfService', ['$rootScope', 'performanceService', 'dataService', PdfService]);
