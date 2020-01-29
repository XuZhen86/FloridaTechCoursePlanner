import json
from datetime import datetime

final = {}

final['courses'] =     json.load(open('courses.json', 'r'))
final['sections'] =    json.load(open('sections.json', 'r'))
final['subjects'] =    json.load(open('subjects.json', 'r'))
final['instructors'] = json.load(open('instructors.json', 'r'))

final['timestamp'] = datetime.now().timestamp()
json.dump(final, open('final.json', 'w'))
