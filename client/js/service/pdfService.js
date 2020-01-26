'use strict';

app.service('pdfService', function pdfService($rootScope) {
    this.print = function print(hello) {
        console.log(hello);
    };

    this.generateRegForm = async function generateRegForm(sections) {
        const regFormBytes = (await (await fetch('/client/forms/registration.pdf')).arrayBuffer());
        const pdfDoc = await PDFLib.PDFDocument.load(regFormBytes);
        const page = pdfDoc.getPages()[0];

        const xs = [
            ['crn', 50],
            ['subject', 100],
            ['course', 135],
            ['section', 187],
            ['title', 215]
        ];
        let y = 792 - 260;

        for (const section of sections) {
            for (const [field, x] of xs) {
                if (field == 'days') {
                    continue;
                }

                if (field == 'times') {
                    continue;
                }

                if (field == 'cr') {
                    continue;
                }

                page.drawText(
                    `${section[field]}`,
                    {
                        x: x,
                        y: y,
                        size: 10
                    }
                );
            }

            y -= 24;
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        document.getElementById('pdfEmbed').src = blobUrl;
    };

    $rootScope.$broadcast('serviceReady', this.constructor.name);
});
