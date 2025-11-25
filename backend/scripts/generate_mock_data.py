"""
Convert fall_2025_courses.json to frontend mockData format
"""
import json
import sys
from pathlib import Path

def convert_to_mock_data(json_file: str, output_file: str):
    """Convert SFU course JSON to frontend mockData format."""
    
    with open(json_file, 'r') as f:
        courses_data = json.load(f)
    
    mock_courses = []
    course_groups_dict = {}
    
    for course_data in courses_data:
        info = course_data.get('info', {})
        instructor_list = course_data.get('instructor', [])
        schedule_list = course_data.get('courseSchedule', [])
        enrollment_data = course_data.get('enrollmentData', {})
        
        # Extract course info
        course_name = info.get('name', '')
        if not course_name:
            continue
        
        parts = course_name.split()
        if len(parts) < 3:  # e.g., "CMPT 105W D100"
            continue
            
        dept = parts[0]
        number = parts[1].replace('W', 'w')
        section_code = parts[2] if len(parts) > 2 else 'D100'
        
        course_key = f'{dept}-{number}'
        
        # Get instructor
        instructor_name = 'TBD'
        if instructor_list:
            instructor_name = instructor_list[0].get('name', 'TBD')
        
        # Parse schedule
        schedule = []
        for sched in schedule_list:
            if not sched.get('isExam', False):
                days_str = sched.get('days', '')
                for day in ['Mo', 'Tu', 'We', 'Th', 'Fr']:
                    if day in days_str:
                        day_map = {'Mo': 'Mon', 'Tu': 'Tue', 'We': 'Wed', 'Th': 'Thu', 'Fr': 'Fri'}
                        schedule.append({
                            'day': day_map[day],
                            'startTime': sched.get('startTime', ''),
                            'endTime': sched.get('endTime', ''),
                            'type': 'Lecture' if 'LEC' in sched.get('sectionCode', '') else 'Lab'
                        })
        
        section_id = f"{dept.lower()}{number}-{section_code.lower()}"
        
        # Get enrollment data
        enrolled_str = enrollment_data.get('enrolled', 'Check CourSys')
        waitlist_str = enrollment_data.get('waitlist')
        waitlist_display = f"({waitlist_str}W)" if waitlist_str else ''
        
        section_obj = {
            'id': section_id,
            'dept': dept,
            'number': number,
            'section': section_code,
            'title': info.get('title', ''),
            'instructor': instructor_name,
            'credits': int(info.get('units', 3)),
            'location': schedule_list[0].get('campus', 'Burnaby Campus') + ' Campus' if schedule_list else 'Burnaby Campus',
            'schedule': schedule[:4],  # Limit to 4 schedule entries
            'stats': {
                'enrolled': enrolled_str,
                'waitlist': waitlist_display,
                'profRating': 'N/A',
                'avgGrade': 'N/A',
                'textbookISBN': 'None'
            },
            'color': '#5B2C6F'
        }
        
        mock_courses.append(section_obj)
        
        # Group by course
        if course_key not in course_groups_dict:
            course_groups_dict[course_key] = {
                'courseKey': course_key,
                'dept': dept,
                'number': number,
                'title': info.get('title', ''),
                'sections': [],
                'isScheduled': False,
                'scheduledSectionId': None,
                'offeringFrequency': {
                    'label': 'Usually Offered in Springs',
                    'color': 'bg-green-600'
                }
            }
        
        course_groups_dict[course_key]['sections'].append(section_obj)
    
    mock_course_groups = list(course_groups_dict.values())
    
    # Generate TypeScript file
    output = f"""import {{ CourseSection, CourseGroup }} from '../types';

export const mockCourses: CourseSection[] = {json.dumps(mock_courses, indent=2)};

// Group courses by course number
export const mockCourseGroups: CourseGroup[] = {json.dumps(mock_course_groups, indent=2)};

export const departments = [
  'CMPT - Computing Science',
  'MATH - Mathematics',
  'ENSC - Engineering Science',
  'PHYS - Physics',
  'STAT - Statistics'
];

export const terms = [
  'Spring 2026',
  'Summer 2026',
  'Fall 2025',
  'Spring 2025'
];
"""
    
    with open(output_file, 'w') as f:
        f.write(output)
    
    print(f"✅ Generated mockData with {len(mock_courses)} sections and {len(mock_course_groups)} course groups")
    print(f"   Output: {output_file}")


def parse_schedule(schedule_str: str):
    """Parse schedule string into structured format."""
    if not schedule_str:
        return []
    
    # Example: "Mon 3:30 PM - 5:20 PM"
    # For now, return empty array - can be enhanced later
    return []


if __name__ == "__main__":
    json_file = sys.argv[1] if len(sys.argv) > 1 else "data/fall_2025_courses.json"
    output_file = sys.argv[2] if len(sys.argv) > 2 else "../frontend/src/data/mockData.ts"
    
    convert_to_mock_data(json_file, output_file)
