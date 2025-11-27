#!/usr/bin/env python3
"""
Fetch prerequisite information from CourSys and update the course database
"""
import json
import time
import re
import requests
from pathlib import Path

def extract_prerequisite(descrlong: str) -> str:
    """
    Extract prerequisite text from course description
    Format: "...some text. Prerequisite: CMPT 120 and MATH 151. More text..."
    """
    if not descrlong:
        return ""
    
    # Find "Prerequisite:" or "Corequisite:" and extract until the next sentence
    patterns = [
        r'Prerequisite:\s*([^.]+\.)',
        r'Prerequisites:\s*([^.]+\.)',
        r'Prereq:\s*([^.]+\.)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, descrlong, re.IGNORECASE)
        if match:
            prereq_text = match.group(1).strip()
            # Remove the trailing period
            if prereq_text.endswith('.'):
                prereq_text = prereq_text[:-1]
            return prereq_text
    
    return ""

def fetch_prerequisite_from_coursys(dept: str, number: str, section: str, term: str = "2025fa") -> str:
    """
    Fetch prerequisite from CourSys AJAX endpoint
    """
    url = f"https://coursys.sfu.ca/browse/info/{term}-{dept.lower()}-{number.lower()}-{section.lower()}?data=yes"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            descrlong = data.get('descrlong', '')
            return extract_prerequisite(descrlong)
    except Exception as e:
        print(f"Error fetching {dept}-{number}-{section}: {e}")
    
    return ""

def main():
    # Load the current course data
    data_file = Path(__file__).parent.parent / 'data' / 'fall_2025_courses_with_enrollment.json'
    
    with open(data_file, 'r') as f:
        courses = json.load(f)
    
    print(f"Loaded {len(courses)} courses")
    
    # Track unique course codes we've already processed
    processed = set()
    updated_count = 0
    
    for course in courses:
        info = course.get('info', {})
        dept = info.get('dept', '')
        number = info.get('number', '')
        section = info.get('section', '')
        
        if not dept or not number:
            continue
        
        # Use course code without section to avoid duplicate fetches
        course_code = f"{dept}-{number}"
        
        if course_code in processed:
            continue
        
        processed.add(course_code)
        
        print(f"Fetching prerequisite for {dept.upper()}-{number}...")
        
        # Convert section format: "D100" -> "d1"
        section_code = section.lower()
        if len(section_code) >= 2:
            match = re.match(r'^([a-z])(\d)', section_code)
            if match:
                section_code = match.group(1) + match.group(2)
        
        prereq = fetch_prerequisite_from_coursys(dept, number, section_code)
        
        if prereq:
            print(f"  ✓ Found: {prereq[:80]}...")
            # Update ALL sections of this course
            for c in courses:
                c_info = c.get('info', {})
                if c_info.get('dept') == dept and c_info.get('number') == number:
                    c_info['prerequisites'] = prereq
                    updated_count += 1
        else:
            print(f"  ✗ No prerequisite found")
        
        # Rate limiting
        time.sleep(0.5)
    
    # Save the updated data
    output_file = data_file.parent / 'fall_2025_courses_with_prerequisites.json'
    with open(output_file, 'w') as f:
        json.dump(courses, f, indent=2)
    
    print(f"\n✅ Updated {updated_count} course sections")
    print(f"✅ Saved to {output_file}")

if __name__ == '__main__':
    main()
