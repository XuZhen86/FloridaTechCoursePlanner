import json
import re
import sys


def parseTags(s):
    # http://catalog.fit.edu/content.php?catoid=8&navoid=295
    tagPairs = [
        ['HU',  'Humanities Elective'],
        ['SS',  'Social Science Elective'],
        ['LA',  'Liberal Arts Elective'],
        ['CL',  'Computer Literacy Requirement'],
        ['COM', 'Communication Elective'],
        ['Q',   'Scholarly Inquiry Requirement'],
        ['CC',  'Cross-cultural'],
        ['HON', 'Honors']
    ]

    matches = [match[1:-1].upper()
               for match in re.compile(r'(\([A-Za-z/]+\))').findall(s)]
    tags = []

    for match in matches:
        splits = match.split('/')
        for split in splits:
            tags.extend([pair for pair in tagPairs if pair[0] == split])

    tags.sort(key=lambda pair: pair[0])
    return tags


sections = json.load(open(sys.argv[1], 'r'))
for section in sections:
    section['cap'] =    [int(cap) for cap in section['cap']]
    section['course'] = int(section['course'])
    section['cr'] =     [float(cr) for cr in section['cr']]
    section['crn'] =    int(section['crn'])
    section['tags'] =   parseTags(section['description'])
    section['times'] =  list(map(lambda time: [int(time[0]), int(time[1])], section['times']))

sections.sort(key=lambda s: s['crn'])
json.dump(sections, open(sys.argv[2], 'w'), indent=4)
