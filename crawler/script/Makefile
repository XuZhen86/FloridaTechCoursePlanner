SCRAPY_OPTIONS=-s LOG_LEVEL=WARNING -s CLOSESPIDER_ERRORCOUNT=1 -s CONCURRENT_REQUESTS=1

final.json: final.py subjects.json courses.json sections.json instructors.json
	$(PYTHON3) final.py

instructors.json: instructors.py sections.json
	$(PYTHON3) instructors.py

subjects.json: subjects.py courses.json
	$(PYTHON3) subjects.py

courses.json: courses.py sections.json
	$(PYTHON3) courses.py

sections.json: sections.py sections-scrapy.json
	$(PYTHON3) sections.py

sections-scrapy.json: sections-scrapy.py
	rm -f sections-scrapy.json
	$(SCRAPY) runspider sections-scrapy.py ${SCRAPY_OPTIONS} -o sections-scrapy.json

clean:
	rm -f *.json

.PHONY: sections-scrapy.json
