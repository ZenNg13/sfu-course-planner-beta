"""
Load courses from JSON file into database.
"""
import json
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session
from database import engine, create_db_and_tables
from models import Course, Section
from services.parser import PrerequisiteParser

def load_json_to_database(json_file: str):
    """Load courses from JSON file into database."""
    
    print(f"📂 Loading courses from {json_file}...")
    
    # Create tables
    create_db_and_tables()
    
    # Load JSON data
    with open(json_file, 'r') as f:
        courses_data = json.load(f)
    
    print(f"✅ Found {len(courses_data)} courses in JSON")
    
    parser = PrerequisiteParser()
    courses_added = 0
    sections_added = 0
    
    with Session(engine) as session:
        for course_data in courses_data:
            info = course_data.get('info', {})
            
            # Extract course info
            course_code = info.get('name', '').split()
            if len(course_code) < 2:
                continue
                
            dept = course_code[0]
            number = course_code[1].replace('W', 'w')  # Keep W lowercase
            
            # Check if course already exists
            from sqlmodel import select
            existing = session.exec(
                select(Course).where(
                    Course.dept == dept,
                    Course.number == number
                )
            ).first()
            
            if existing:
                print(f"⏭️  Skipping {dept} {number} (already exists)")
                continue
            
            # Parse prerequisites
            prereq_text = info.get('prerequisites', '')
            prereq_logic = None
            if prereq_text and prereq_text.strip():
                try:
                    prereq_logic = parser.parse(prereq_text)
                except:
                    pass
            
            # Create course
            course_id = f"{dept}-{number}"
            course = Course(
                id=course_id,
                dept=dept,
                number=number,
                title=info.get('title', ''),
                description=info.get('description', ''),
                credits=int(info.get('units', 3)),
                prerequisites_raw=prereq_text if prereq_text else None,
                prerequisites_logic=prereq_logic
            )
            
            session.add(course)
            session.flush()  # Get the course ID
            courses_added += 1
            
            # Add sections
            for section_data in course_data.get('sections', []):
                section_info = section_data.get('info', {})
                
                section = Section(
                    course_id=course.id,
                    section_code=section_info.get('section', 'D100'),
                    instructor=section_info.get('instructor', 'TBD'),
                    schedule=section_info.get('classSchedule', ''),
                    location=section_info.get('deliveryMethod', 'In Person'),
                    seats_total=int(section_info.get('enrollmentCap', 0)),
                    seats_available=int(section_info.get('enrollmentCap', 0)) - int(section_info.get('totalEnrolled', 0)),
                    waitlist_total=int(section_info.get('waitListCap', 0)),
                    waitlist_available=int(section_info.get('waitListCap', 0)) - int(section_info.get('totalWaitlist', 0))
                )
                
                session.add(section)
                sections_added += 1
            
            print(f"✅ Added {dept} {number}: {course.title}")
        
        session.commit()
    
    print(f"\n🎉 Database seeding complete!")
    print(f"   Courses added: {courses_added}")
    print(f"   Sections added: {sections_added}")


if __name__ == "__main__":
    json_file = sys.argv[1] if len(sys.argv) > 1 else "../data/fall_2025_courses.json"
    load_json_to_database(json_file)
