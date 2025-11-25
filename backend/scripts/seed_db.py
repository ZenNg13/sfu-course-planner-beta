"""
Database Seeding Script.
Crawls SFU API and populates the database with course data.
"""
import asyncio
import logging
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlmodel import Session
from database import engine, create_db_and_tables
from models import Course, Section
from services.crawler import SFUCrawler
from services.parser import PrerequisiteParser

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


async def seed_database(
    departments: list[str] | None = None,
    term: str = "2026/spring"
) -> None:
    """
    Seed the database with course data from SFU.
    
    Args:
        departments: List of department codes to crawl. If None, crawls all.
        term: Term to crawl (e.g., "2026/spring")
    """
    logger.info("Starting database seed...")
    
    # Create tables if they don't exist
    create_db_and_tables()
    logger.info("Database tables ready")
    
    # Initialize crawler and parser
    crawler = SFUCrawler()
    parser = PrerequisiteParser()
    
    # Crawl course data
    logger.info(f"Crawling courses for term: {term}")
    if departments:
        logger.info(f"Departments: {', '.join(departments)}")
    
    all_courses = await crawler.crawl_all_courses(departments, term)
    
    if not all_courses:
        logger.warning("No courses were fetched. Check the crawler implementation.")
        return
    
    logger.info(f"Fetched {len(all_courses)} courses. Saving to database...")
    
    # Save to database
    with Session(engine) as session:
        courses_added = 0
        sections_added = 0
        
        for course_data in all_courses:
            try:
                # Check if course already exists
                existing_course = session.get(Course, course_data["id"])
                
                if existing_course:
                    course = existing_course
                    logger.debug(f"Course {course.id} already exists, updating...")
                else:
                    # Parse prerequisites
                    prereq_tree = None
                    if course_data.get("prerequisites_raw"):
                        prereq_tree = parser.parse(course_data["prerequisites_raw"])
                    
                    # Create course
                    course = Course(
                        id=course_data["id"],
                        dept=course_data["dept"],
                        number=course_data["number"],
                        title=course_data["title"],
                        description=course_data.get("description"),
                        credits=course_data.get("credits", 3),
                        prerequisites_raw=course_data.get("prerequisites_raw"),
                        prerequisites_logic=prereq_tree
                    )
                    
                    session.add(course)
                    courses_added += 1
                
                # Add sections
                for section_data in course_data.get("sections", []):
                    section = Section(
                        course_id=course.id,
                        term=section_data["term"],
                        section_code=section_data["section_code"],
                        instructor=section_data.get("instructor"),
                        schedule_json=section_data.get("schedule_json"),
                        location=section_data.get("location"),
                        delivery_method=section_data.get("delivery_method", "In Person"),
                        seats_total=section_data.get("seats_total", 0),
                        seats_enrolled=section_data.get("seats_enrolled", 0),
                        waitlist_total=section_data.get("waitlist_total", 0),
                        waitlist_enrolled=section_data.get("waitlist_enrolled", 0)
                    )
                    
                    session.add(section)
                    sections_added += 1
                
                # Commit in batches
                if courses_added % 10 == 0:
                    session.commit()
                    logger.info(f"Progress: {courses_added} courses, {sections_added} sections")
                
            except Exception as e:
                logger.error(f"Error processing course {course_data.get('id', 'unknown')}: {e}")
                continue
        
        # Final commit
        session.commit()
        
        logger.info("=" * 60)
        logger.info(f"✅ Database seeding complete!")
        logger.info(f"   Courses added: {courses_added}")
        logger.info(f"   Sections added: {sections_added}")
        logger.info("=" * 60)


async def seed_sample_data() -> None:
    """
    Seed the database with sample/mock data for testing.
    Useful when SFU API is unavailable or for development.
    """
    logger.info("Seeding with sample data...")
    
    create_db_and_tables()
    parser = PrerequisiteParser()
    
    # Sample courses
    sample_courses = [
        {
            "id": "CMPT-120",
            "dept": "CMPT",
            "number": "120",
            "title": "Introduction to Computing Science and Programming I",
            "description": "An elementary introduction to computing science and computer programming.",
            "credits": 3,
            "prerequisites_raw": None,
            "sections": [
                {
                    "term": "Spring 2026",
                    "section_code": "D100",
                    "instructor": "Dr. Smith",
                    "schedule_json": [
                        {"day": "Mon", "start": "10:30", "end": "11:20", "type": "Lecture"},
                        {"day": "Wed", "start": "10:30", "end": "11:20", "type": "Lecture"},
                        {"day": "Fri", "start": "10:30", "end": "11:20", "type": "Lecture"}
                    ],
                    "location": "Burnaby Campus",
                    "delivery_method": "In Person",
                    "seats_total": 200,
                    "seats_enrolled": 195,
                    "waitlist_total": 20,
                    "waitlist_enrolled": 5
                }
            ]
        },
        {
            "id": "CMPT-125",
            "dept": "CMPT",
            "number": "125",
            "title": "Introduction to Computing Science and Programming II",
            "description": "A rigorous introduction to computing science and computer programming.",
            "credits": 3,
            "prerequisites_raw": "CMPT 120 or 102",
            "sections": [
                {
                    "term": "Spring 2026",
                    "section_code": "D100",
                    "instructor": "Dr. Johnson",
                    "schedule_json": [
                        {"day": "Tue", "start": "14:30", "end": "15:20", "type": "Lecture"},
                        {"day": "Thu", "start": "14:30", "end": "15:20", "type": "Lecture"}
                    ],
                    "location": "Burnaby Campus",
                    "delivery_method": "In Person",
                    "seats_total": 150,
                    "seats_enrolled": 150,
                    "waitlist_total": 15,
                    "waitlist_enrolled": 12
                }
            ]
        },
        {
            "id": "CMPT-225",
            "dept": "CMPT",
            "number": "225",
            "title": "Data Structures and Programming",
            "description": "Introduction to a variety of practical and important data structures and methods for implementation.",
            "credits": 3,
            "prerequisites_raw": "CMPT 125 and (MACM 101 or MATH 151)",
            "sections": [
                {
                    "term": "Spring 2026",
                    "section_code": "D100",
                    "instructor": "Dr. Williams",
                    "schedule_json": [
                        {"day": "Mon", "start": "13:30", "end": "14:20", "type": "Lecture"},
                        {"day": "Wed", "start": "13:30", "end": "14:20", "type": "Lecture"},
                        {"day": "Fri", "start": "13:30", "end": "14:20", "type": "Lecture"}
                    ],
                    "location": "Burnaby Campus",
                    "delivery_method": "In Person",
                    "seats_total": 180,
                    "seats_enrolled": 165,
                    "waitlist_total": 10,
                    "waitlist_enrolled": 0
                }
            ]
        },
        {
            "id": "CMPT-295",
            "dept": "CMPT",
            "number": "295",
            "title": "Introduction to Computer Systems",
            "description": "The curriculum introduces students to computer systems.",
            "credits": 4,
            "prerequisites_raw": "CMPT 125 and (MACM 101 or MATH 151)",
            "sections": [
                {
                    "term": "Spring 2026",
                    "section_code": "D100",
                    "instructor": "Dr. Brown",
                    "schedule_json": [
                        {"day": "Mon", "start": "15:30", "end": "17:20", "type": "Lecture"},
                        {"day": "Wed", "start": "14:30", "end": "16:20", "type": "Lecture"}
                    ],
                    "location": "Burnaby Campus",
                    "delivery_method": "In Person",
                    "seats_total": 195,
                    "seats_enrolled": 195,
                    "waitlist_total": 20,
                    "waitlist_enrolled": 15
                }
            ]
        },
        {
            "id": "CMPT-276",
            "dept": "CMPT",
            "number": "276",
            "title": "Introduction to Software Engineering",
            "description": "An introduction to software engineering.",
            "credits": 3,
            "prerequisites_raw": "CMPT 225",
            "sections": [
                {
                    "term": "Spring 2026",
                    "section_code": "D100",
                    "instructor": "Dr. Davis",
                    "schedule_json": [
                        {"day": "Tue", "start": "10:30", "end": "11:20", "type": "Lecture"},
                        {"day": "Thu", "start": "10:30", "end": "11:20", "type": "Lecture"}
                    ],
                    "location": "Surrey Campus",
                    "delivery_method": "In Person",
                    "seats_total": 100,
                    "seats_enrolled": 85,
                    "waitlist_total": 10,
                    "waitlist_enrolled": 0
                }
            ]
        },
        {
            "id": "CMPT-300",
            "dept": "CMPT",
            "number": "300",
            "title": "Operating Systems I",
            "description": "Introduction to operating systems.",
            "credits": 3,
            "prerequisites_raw": "CMPT 225 and CMPT 295",
            "sections": [
                {
                    "term": "Spring 2026",
                    "section_code": "D100",
                    "instructor": "Dr. Wilson",
                    "schedule_json": [
                        {"day": "Mon", "start": "11:30", "end": "12:20", "type": "Lecture"},
                        {"day": "Wed", "start": "11:30", "end": "12:20", "type": "Lecture"},
                        {"day": "Fri", "start": "11:30", "end": "12:20", "type": "Lecture"}
                    ],
                    "location": "Burnaby Campus",
                    "delivery_method": "In Person",
                    "seats_total": 120,
                    "seats_enrolled": 118,
                    "waitlist_total": 15,
                    "waitlist_enrolled": 8
                }
            ]
        }
    ]
    
    with Session(engine) as session:
        for course_data in sample_courses:
            # Parse prerequisites
            prereq_tree = None
            if course_data.get("prerequisites_raw"):
                prereq_tree = parser.parse(course_data["prerequisites_raw"])
            
            # Create course
            course = Course(
                id=course_data["id"],
                dept=course_data["dept"],
                number=course_data["number"],
                title=course_data["title"],
                description=course_data.get("description"),
                credits=course_data["credits"],
                prerequisites_raw=course_data.get("prerequisites_raw"),
                prerequisites_logic=prereq_tree
            )
            
            session.add(course)
            
            # Add sections
            for section_data in course_data["sections"]:
                section = Section(
                    course_id=course.id,
                    term=section_data["term"],
                    section_code=section_data["section_code"],
                    instructor=section_data["instructor"],
                    schedule_json=section_data["schedule_json"],
                    location=section_data["location"],
                    delivery_method=section_data["delivery_method"],
                    seats_total=section_data["seats_total"],
                    seats_enrolled=section_data["seats_enrolled"],
                    waitlist_total=section_data["waitlist_total"],
                    waitlist_enrolled=section_data["waitlist_enrolled"]
                )
                
                session.add(section)
        
        session.commit()
        
        logger.info("✅ Sample data seeded successfully!")
        logger.info(f"   Courses: {len(sample_courses)}")
        logger.info(f"   Sections: {sum(len(c['sections']) for c in sample_courses)}")


if __name__ == "__main__":
    import argparse
    
    arg_parser = argparse.ArgumentParser(description="Seed the database with course data")
    arg_parser.add_argument(
        "--mode",
        choices=["sample", "crawl"],
        default="sample",
        help="Seed mode: 'sample' for mock data, 'crawl' to fetch from SFU API"
    )
    arg_parser.add_argument(
        "--departments",
        nargs="+",
        help="Department codes to crawl (e.g., CMPT MATH). Only used in 'crawl' mode."
    )
    arg_parser.add_argument(
        "--term",
        default="2026/spring",
        help="Term to crawl (e.g., '2026/spring'). Only used in 'crawl' mode."
    )
    
    args = arg_parser.parse_args()
    
    if args.mode == "sample":
        asyncio.run(seed_sample_data())
    else:
        asyncio.run(seed_database(args.departments, args.term))
