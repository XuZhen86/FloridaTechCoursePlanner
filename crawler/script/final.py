from datetime import datetime
import json
import sys

final = {}

final['sections'] =    json.load(open(sys.argv[1], 'r'))
final['courses'] =     json.load(open(sys.argv[2], 'r'))
final['subjects'] =    json.load(open(sys.argv[3], 'r'))
final['instructors'] = json.load(open(sys.argv[4], 'r'))

final['timestamp'] = datetime.now().timestamp()
json.dump(final, open(sys.argv[5], 'w'))
