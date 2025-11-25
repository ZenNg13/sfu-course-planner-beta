#!/usr/bin/env python3
"""
Test script to fetch a few courses with enrollment data
"""
from sfu_api_client import SFUAPIClient

def main():
    client = SFUAPIClient(rate_limit_delay=0.3)
    
    print("Testing enrollment data fetch for CMPT courses...\n")
    
    # Test with just a few courses
    courses = client.crawl_department('2025', 'fall', 'cmpt', include_enrollment=True)
    
    # Show first 5 courses with enrollment
    print("\n" + "="*60)
    print("Sample courses with enrollment data:")
    print("="*60)
    
    for course in courses[:5]:
        info = course.get('info', {})
        enrollment = course.get('enrollmentData', {})
        
        course_name = info.get('name', 'Unknown')
        enrolled = enrollment.get('enrolled', 'N/A')
        waitlist = enrollment.get('waitlist', 'N/A')
        
        print(f"\n{course_name}")
        print(f"  Enrolled: {enrolled}")
        print(f"  Waitlist: {waitlist}")

if __name__ == "__main__":
    main()
