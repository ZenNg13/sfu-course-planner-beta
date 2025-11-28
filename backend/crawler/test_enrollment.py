#!/usr/bin/env python3
"""
Test script to fetch courses with enrollment data for multiple departments
"""
from sfu_api_client import SFUAPIClient, save_courses_to_json

def main():
    client = SFUAPIClient(rate_limit_delay=0.3)
    
    departments = ['cmpt', 'math', 'macm', 'stat']
    all_courses = []
    
    print(f"Fetching enrollment data for {', '.join([d.upper() for d in departments])} courses...\n")
    
    for dept in departments:
        print(f"📚 Crawling {dept.upper()} courses...")
        courses = client.crawl_department('2025', 'fall', dept, include_enrollment=True)
        all_courses.extend(courses)
        print(f"✅ Added {len(courses)} {dept.upper()} sections\n")
    
    # Save to file
    if all_courses:
        output_file = "../data/fall_2025_courses_with_enrollment.json"
        save_courses_to_json(all_courses, output_file)
        print(f"\n✅ Total sections saved: {len(all_courses)}")
        
        # Show sample
        print("\n" + "="*60)
        print("Sample courses with enrollment data:")
        print("="*60)
        
        for course in all_courses[:5]:
            info = course.get('info', {})
            enrollment = course.get('enrollmentData', {})
            
            course_name = info.get('name', 'Unknown')
            enrolled = enrollment.get('enrolled', 'N/A')
            waitlist = enrollment.get('waitlist', 'N/A')
            
            print(f"\n{course_name}")
            print(f"  Enrolled: {enrolled}")
            print(f"  Waitlist: {waitlist}")
    else:
        print("❌ No courses found!")

if __name__ == "__main__":
    main()
