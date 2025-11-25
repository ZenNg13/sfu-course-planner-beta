# Quick Start Guide

## What Changed?

### ✅ Fixed Issues
1. **Removed duplicate files** - Deleted 3 unnecessary JSON files
2. **Removed static mock data** - Frontend now uses backend API
3. **Fully automatic** - All data fetched from SFU automatically
4. **Clarified database** - Using SQLite (not PostgreSQL)

### 🎯 How It Works Now

```
┌─────────────────────────────────────────────────────────┐
│                    DATA SOURCES                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SFU API                           CourSys             │
│  (Course info)                     (Live enrollment)    │
│       │                                    │            │
│       v                                    v            │
│  [Python Crawler]  ──────────────>  [Backend API]      │
│       │                                    │            │
│       v                                    v            │
│  JSON Cache                         Real-time data      │
│  (251 courses)                      (5-min refresh)     │
│       │                                    │            │
│       └──────────> [Frontend] <───────────┘            │
│                         │                               │
│                         v                               │
│                   [Your Browser]                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Current Files

### Data Files
```
backend/data/
  └── fall_2025_courses_with_enrollment.json  (1.3MB)
      ├── 251 CMPT sections
      ├── Course titles, descriptions
      ├── Schedule information
      └── Initial enrollment snapshot
```

**All other JSON files have been deleted** ✅

### Database
```
backend/sfu_scheduler.db  (SQLite)
  ├── courses (84 rows)
  ├── sections (6 rows)
  └── watchers (for alerts)
```

**Note**: Database is underpopulated but system works fine:
- Course search uses JSON file
- Enrollment uses live CourSys API

## Running the App

### 1. Start Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate
python3 main.py
```
✓ Backend running on http://localhost:8000

### 2. Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
✓ Frontend running on http://localhost:3000

### 3. Open Browser
Go to: http://localhost:3000

## What You Can Do

### Search Courses
1. Type in search bar: "CMPT 354"
2. Click on course from dropdown
3. Click "Add" button
4. Course appears in your list

### Schedule a Section
1. Click "Select Section" on any course
2. See all available sections with **LIVE enrollment**
3. Choose a section
4. It appears on your calendar

### View External Links
- **CourSys**: Direct link to course page
- **Rate My Professor**: Search for instructor
- **SFU Bookstore**: Find textbooks
- **CourseDiggers**: See grade distributions

## Data Updates

### Automatic
- ✅ Enrollment numbers refresh every 5 minutes
- ✅ Frontend fetches courses on page load

### Manual (Optional)
If you want to fetch the latest course catalog:
```bash
cd backend
source venv/bin/activate
python3 -m crawler.test_crawler
```

This updates: `backend/data/fall_2025_courses_with_enrollment.json`

## API Endpoints

### Get All Courses
```bash
curl http://localhost:8000/api/v1/courses/all
```
Returns: 251 CMPT courses

### Get Live Enrollment (Single)
```bash
curl http://localhost:8000/api/v1/courses/enrollment/CMPT/354/D100?term=2025/fall
```
Returns:
```json
{
  "dept": "CMPT",
  "number": "354",
  "section": "D100",
  "enrolled": "150/150",
  "waitlist": "15",
  "timestamp": "2025-11-25T10:30:00"
}
```

### Get Live Enrollment (Batch)
```bash
curl -X POST http://localhost:8000/api/v1/courses/enrollment/batch?term=2025/fall \
  -H "Content-Type: application/json" \
  -d '[
    {"dept": "CMPT", "number": "354", "section": "D100"},
    {"dept": "CMPT", "number": "120", "section": "D100"}
  ]'
```

## FAQ

### Q: Do we use PostgreSQL?
**A: No, we use SQLite** (file: `backend/sfu_scheduler.db`)

### Q: Do we still use mockData.ts?
**A: No, it's been deleted.** Frontend now fetches from backend API.

### Q: How many JSON files do we have?
**A: Just 1** - `backend/data/fall_2025_courses_with_enrollment.json`

### Q: Is the data automatic?
**A: Yes!**
- Course search: Fetched from backend on page load
- Enrollment: Fetched live from CourSys every 5 minutes

### Q: Why is enrollment sometimes "N/A"?
**A:** CourSys might be slow or temporarily unavailable. The hook will retry.

### Q: Can I add more departments?
**A:** Yes! Edit the crawler to fetch MATH, ENSC, etc:
```python
client.crawl_department(year, season, 'math')
```

## Troubleshooting

### Backend won't start
```bash
# Make sure virtual environment is activated
cd backend
source venv/bin/activate

# Check if port 8000 is available
lsof -i :8000

# If blocked, kill the process:
kill -9 $(lsof -t -i :8000)
```

### Frontend shows no courses
```bash
# Check backend is running
curl http://localhost:8000/api/v1/health

# Check API returns data
curl http://localhost:8000/api/v1/courses/all | head -20

# Check browser console for errors
# (F12 → Console tab)
```

### Enrollment shows "Loading..."
This is normal for the first few seconds. If it stays:
- Check backend logs for CourSys errors
- CourSys might be temporarily down
- Try a different course

## File Structure

```
SFU-Course-Tracker-beta/
├── backend/
│   ├── main.py                    # FastAPI server
│   ├── requirements.txt           # Python dependencies
│   ├── sfu_scheduler.db          # SQLite database
│   ├── crawler/
│   │   ├── sfu_api_client.py     # Fetches from SFU + CourSys
│   │   └── test_crawler.py       # Run crawler manually
│   ├── data/
│   │   └── fall_2025_courses_with_enrollment.json  # 251 courses
│   └── routers/
│       └── courses.py             # API endpoints
├── frontend/
│   ├── package.json               # Node dependencies
│   ├── vite.config.ts            # Build config
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   │   └── ControlBar.tsx    # Search bar (uses API)
│   │   │   └── CourseList/
│   │   │       └── CourseCard.tsx    # Shows live enrollment
│   │   ├── hooks/
│   │   │   └── useEnrollmentData.ts  # Live data hook
│   │   └── services/
│   │       └── api.ts             # Backend API calls
├── ARCHITECTURE.md                # Full documentation
├── QUICK_START.md                # This file
└── README.md                     # Project overview
```

## Next Steps

1. **Test the app**: Start both servers and open http://localhost:3000
2. **Search a course**: Type "CMPT 354" and add it
3. **Select a section**: See live enrollment numbers
4. **Schedule it**: Drag to calendar
5. **Check external links**: CourSys, RMP, textbooks all work

---

**Need help?** Check `ARCHITECTURE.md` for detailed docs.
