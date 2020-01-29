import json

instructors = []

sections = json.load(open('sections.json', 'r'))
for sectionIdx, section in enumerate(sections):
    # Find instructor for this section
    foundInstructors = [
        instructor
        for instructor in instructors
        if instructor['name'] == section['instructor']
    ]

    # If instructor does not exist, add a new instructor
    if len(foundInstructors) == 0:
        instructors.append({
            'name':         section['instructor'],
            'sectionIdxs':  [sectionIdx]
        })

    # If instructor exists, update this instructor
    if len(foundInstructors) == 1:
        instructor = foundInstructors[0]
        # Section Indexs
        instructor['sectionIdxs'].append(sectionIdx)

instructors.sort(key=lambda i: i['name'])
json.dump(instructors, open('instructors.json', 'w'), indent=4)