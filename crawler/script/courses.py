import json
import sys

courses = []

sections = json.load(open(sys.argv[1], 'r'))
for sectionIdx, section in enumerate(sections):
    # Find course for this section
    foundCourses = [
        course
        for course in courses
        if course['subject'] == section['subject'] and course['course'] == section['course']
    ]

    # If course does not exist, add a new course
    if len(foundCourses) == 0:
        courses.append({
            'course':       section['course'],
            'cr':           section['cr'],
            'sectionIdxs':  [sectionIdx],
            'description':  section['description'],
            'subject':      section['subject'],
            'tags':         section['tags'],
            'title':        section['title']
        })

    # If course exists, update this course
    if len(foundCourses) == 1:
        course = foundCourses[0]
        # CR
        course['cr'][0] = min(course['cr'][0], section['cr'][0])
        course['cr'][1] = max(course['cr'][1], section['cr'][1])
        # Tags
        for tag in section['tags']:
            if tag not in course['tags']:
                course['tags'].append(tag)
        # Section Indexes
        course['sectionIdxs'].append(sectionIdx)

courses.sort(key=lambda c: (c['subject'], c['course']))
json.dump(courses, open(sys.argv[2], 'w'), indent=4)
