import scrapy


class ScheduleMetaCrawler(scrapy.Spider):
    name =            'ScheduleMetaCrawler'
    allowed_domains = ['apps.fit.edu']
    start_urls =      [
        'https://apps.fit.edu/schedule/main-campus/spring',
        'https://apps.fit.edu/schedule/main-campus/summer',
        'https://apps.fit.edu/schedule/main-campus/fall'
    ]

    def parse(self, response):
        titleString = response.xpath('//html/body/div[4]/div[2]/h2/text()').extract()[0]
        titleString = titleString[28:]
        title = titleString.split(' ')

        # print(output)
        yield {
            'title': title
        }
