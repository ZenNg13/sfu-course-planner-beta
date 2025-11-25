#!/usr/bin/env python3
import httpx
from bs4 import BeautifulSoup
import re

url = 'https://coursys.sfu.ca/browse/info/2025fa-cmpt-120-d1'
print(f"Fetching: {url}\n")

response = httpx.get(url, timeout=10)
print(f"Status: {response.status_code}\n")

soup = BeautifulSoup(response.text, 'html.parser')

# Search for enrollment in the full text
text = soup.get_text()

# Look for enrollment pattern: "Enrolment161 out of 331"
pattern = r'Enrolment\s*(\d+)\s*out of\s*(\d+)'
match = re.search(pattern, text)

if match:
    enrolled = match.group(1)
    capacity = match.group(2)
    print(f"Found enrollment: {enrolled}/{capacity}")
else:
    print("Enrollment pattern not found")
    
# Look for waitlist
waitlist_pattern = r'waitlist.*?(\d+)'
waitlist_match = re.search(waitlist_pattern, text, re.IGNORECASE)
if waitlist_match:
    print(f"Waitlist: {waitlist_match.group(1)}")

print("\n--- Searching for 'Enrol' in text ---")
for line in text.split('\n'):
    if 'enrol' in line.lower():
        print(line.strip()[:200])
