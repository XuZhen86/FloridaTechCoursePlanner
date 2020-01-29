import json

subjectPairs = [
    ['ASC', 'Academic Support Center'],
    ['AEE', 'Aerospace Engineering'],
    ['AVF', 'Aviation Flight'],
    ['AHF', 'Aviation Human Factors'],
    ['AVM', 'Aviation Management'],
    ['AVS', 'Aviation Science'],
    ['AVT', 'Aviation Technology'],
    ['BEH', 'Behavior Analysis'],
    ['BEHP', 'Behavior Analysis Certificate'],
    ['BEHA', 'Behavior Analysis-Audit'],
    ['BCM', 'Biochemistry'],
    ['BIO', 'Biology'],
    ['BME', 'Biomedical Engineering'],
    ['BUS', 'Business'],
    ['CHE', 'Chemical Engineering'],
    ['CHM', 'Chemistry'],
    ['CVE', 'Civil Engineering'],
    ['COM', 'Communication'],
    ['CIS', 'Computer Information Systems'],
    ['CSE', 'Computer Sciences'],
    ['CON', 'Construction'],
    ['CWE', 'Cooperative Education'],
    ['EDS', 'Education'],
    ['ECE', 'Electrical & Computer Engineer'],
    ['ENM', 'Engineering Management'],
    ['EPE', 'Engineering Protrack Co-op Edu'],
    ['ESL', 'English as a Second Language'],
    ['ENS', 'Environmental Sciences'],
    ['FYE', 'First Year Experience'],
    ['FTE', 'Flight Test Engineering'],
    ['PSF', 'Forensic Psychology'],
    ['HON', 'Honors'],
    ['HCD', 'Human-Centered Design'],
    ['HUM', 'Humanities'],
    ['CYB', 'Info Assurance & Cybersecurity'],
    ['ISC', 'Interdisciplinary Science'],
    ['LNG', 'Languages & Linguistics'],
    ['MGT', 'Management'],
    ['MAR', 'Marine Biology'],
    ['MTH', 'Mathematics'],
    ['MEE', 'Mechanical Engineering'],
    ['MET', 'Meteorology'],
    ['MSC', 'Military Science'],
    ['MUS', 'Music'],
    ['OCE', 'Ocean Engineering'],
    ['OCN', 'Oceanography'],
    ['ORP', 'Operations Research'],
    ['PED', 'Physical Education'],
    ['PHY', 'Physics'],
    ['PSY', 'Psychology'],
    ['SOC', 'Sociology'],
    ['SWE', 'Software Engineering'],
    ['SPS', 'Space Sciences'],
    ['SPC', 'Space Systems'],
    ['SUS', 'Sustainability'],
    ['SYS', 'Systems Engineering'],
    ['WRI', 'Writing'],
]


def findSubjectPairs(s):
    for pair in subjectPairs:
        if pair[0] == s or pair[1] == s:
            return pair
    return [s, s]


subjects = []

courses = json.load(open('courses.json', 'r'))
for courseIdx, course in enumerate(courses):
    # Find subject for this course
    foundSubjects = [
        subject
        for subject in subjects
        if subject['subject'] == course['subject']
    ]

    # If subject does not exist, add a new subject
    if len(foundSubjects) == 0:
        subjects.append({
            'subject':      course['subject'],
            'title':        findSubjectPairs(course['subject'])[1],
            'courseIdxs':   [courseIdx]
        })

    # if subject exists, update this subject
    if len(foundSubjects) == 1:
        subject = foundSubjects[0]
        # Course Indexs
        subject['courseIdxs'].append(courseIdx)

subjects.sort(key=lambda s: s['subject'])
json.dump(subjects, open('subjects.json', 'w'), indent=4)
