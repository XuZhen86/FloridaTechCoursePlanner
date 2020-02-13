SCRAPY_OPTIONS=-s LOG_LEVEL=WARNING -s CLOSESPIDER_ERRORCOUNT=1 -s CONCURRENT_REQUESTS=1

all: spring.json summer.json fall.json scheduleMeta.json

spring.json:
	$(SCRAPY)  runspider      springSectionsCrawler.py ${SCRAPY_OPTIONS} -o springSectionsScrapy.json
	$(PYTHON3) sections.py    springSectionsScrapy.json springSections.json
	$(PYTHON3) courses.py     springSections.json       springCourses.json
	$(PYTHON3) instructors.py springSections.json       springInstructors.json
	$(PYTHON3) subjects.py    springCourses.json        springSubjects.json
	$(PYTHON3) final.py       springSections.json springCourses.json springSubjects.json springInstructors.json spring.json

summer.json:
	$(SCRAPY)  runspider      summerSectionsCrawler.py ${SCRAPY_OPTIONS} -o summerSectionsScrapy.json
	$(PYTHON3) sections.py    summerSectionsScrapy.json summerSections.json
	$(PYTHON3) courses.py     summerSections.json       summerCourses.json
	$(PYTHON3) instructors.py summerSections.json       summerInstructors.json
	$(PYTHON3) subjects.py    summerCourses.json        summerSubjects.json
	$(PYTHON3) final.py       summerSections.json summerCourses.json summerSubjects.json summerInstructors.json summer.json

fall.json:
	$(SCRAPY)  runspider      fallSectionsCrawler.py ${SCRAPY_OPTIONS} -o fallSectionsScrapy.json
	$(PYTHON3) sections.py    fallSectionsScrapy.json fallSections.json
	$(PYTHON3) courses.py     fallSections.json       fallCourses.json
	$(PYTHON3) instructors.py fallSections.json       fallInstructors.json
	$(PYTHON3) subjects.py    fallCourses.json        fallSubjects.json
	$(PYTHON3) final.py       fallSections.json fallCourses.json fallSubjects.json fallInstructors.json fall.json

scheduleMeta.json:
	$(SCRAPY)  runspider      scheduleMetaCrawler.py ${SCRAPY_OPTIONS} -o scheduleMeta.json

clean:
	rm -f *.json
