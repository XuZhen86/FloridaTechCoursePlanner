import json
import re
import scrapy


class SpringSectionsCrawler(scrapy.Spider):
    name =            'SpringSectionsCrawler'
    allowed_domains = ['apps.fit.edu']
    start_urls =      ['https://apps.fit.edu/schedule/main-campus/spring']

    def parse(self, response):
        # Find link to next page
        next_page = response.xpath('//a[@class="icon item" and @rel="next"]/@href').get()
        if next_page is not None:
            # print(next_page)
            yield scrapy.Request(next_page, callback=self.parse)

        # Parse course table
        for tr in response.xpath('//*[@id="course-table"]/tbody/tr'):
            crn = tr.xpath('td[1]/text()').get()

            subject, course = tr.xpath('td[2]/text()').get().split()

            section = tr.xpath('td[3]/text()').get()

            cr = tr.xpath('td[4]/text()').get()
            if '-' in cr:
                cr = cr.split('-')
            else:
                cr = [cr, cr]

            title = tr.xpath('td[5]/span/text()').get().strip()

            description = tr.xpath('td[5]/span/@data-content').get()
            if description is None:
                description = ''
            else:
                description = description.strip()

            note = tr.xpath('td[6]/text()').get()
            if note is None:
                note = ''

            # Spring and fall schedule does not have session field.
            session = ''

            days = [
                i.strip()
                for i in tr.xpath('td[7]/text()').extract() if len(i.strip()) > 0
            ]
            times = [
                [i.strip().split('-')[0], i.strip().split('-')[1]]
                for i in tr.xpath('td[8]/text()').extract() if len(i.strip()) > 0
            ]
            places = [
                [i.strip().split(' ')[0], i.strip().split(' ')[1]]
                for i in tr.xpath('td[9]/text()').extract() if len(i.strip()) > 0
            ]

            instructor = tr.xpath('td[10]/a/text()').get()
            if instructor is None:
                instructor = ''

            cap = [tr.xpath('td[11]/strong/text()').get(), tr.xpath('td[11]/text()').get()[1:]]

            output = {
                'crn':          crn,
                'subject':      subject,
                'course':       course,
                'section':      section,
                'cr':           cr,
                'title':        title,
                'description':  description,
                'note':         note,
                'session':      session,
                'days':         days,
                'times':        times,
                'places':       places,
                'instructor':   instructor,
                'cap':          cap,
            }

            # print(output)
            yield output
