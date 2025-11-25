# Real-Time Enrollment Data Implementation

## ✅ What Was Implemented

Successfully integrated **real-time enrollment data fetching from CourSys** into your SFU Course Tracker!

## 🎯 Key Features

### Backend API Endpoints

1. **Single Course Enrollment** - `GET /api/v1/courses/enrollment/{dept}/{number}/{section}`
   - Fetches live enrollment for one course from CourSys
   - Example: `/api/v1/courses/enrollment/CMPT/354/D100?term=2025/fall`
   - Returns: `{"enrolled": "150/150", "waitlist": "0", ...}`

2. **Batch Enrollment** - `POST /api/v1/courses/enrollment/batch`
   - Fetches enrollment for multiple courses at once
   - More efficient for loading multiple course cards
   - Body: `[{"dept": "CMPT", "number": "354", "section": "D100"}, ...]`

### Frontend Integration

1. **Custom React Hook** - `useEnrollmentData.ts`
   - `useSingleEnrollment()` - For individual course cards
   - `useEnrollmentData()` - For batches of courses
   - Auto-refreshes every 5 minutes
   - Handles loading and error states

2. **Updated Components**
   - `CourseCard.tsx` - Shows live enrollment with loading states
   - `SectionSelectorModal.tsx` - Fetches enrollment when selecting sections
   - Real-time data replaces static mockData

## 🔄 How It Works

### Data Flow:
```
CourSys Website → Backend API → Frontend React Hook → UI Components
     (Live)         (Scrapes)      (Auto-refresh)     (Displays)
```

### CourSys Scraping:
- Uses `sfu_api_client.py` with `get_enrollment_data()` method
- Parses HTML from `coursys.sfu.ca/browse/info/{term}-{dept}-{number}-{section}`
- Extracts enrollment pattern: "Enrolment 150 out of 150"
- No authentication required for browse/info pages

### Auto-Refresh:
- Initial fetch when course card loads
- Auto-refresh every 5 minutes (configurable)
- Shows "Loading..." state during fetch
- Displays "N/A" on error

## 📊 Example API Responses

### Single Course:
```json
{
  "dept": "CMPT",
  "number": "354",
  "section": "D100",
  "enrolled": "150/150",
  "waitlist": "0",
  "timestamp": "2025-11-25T20:37:52",
  "term": "2025/fall"
}
```

### Batch Request:
```json
[
  {"dept": "CMPT", "number": "354", "section": "D100"},
  {"dept": "CMPT", "number": "120", "section": "D100"}
]
```

Returns array of enrollment data for each course.

## 🚀 Testing

### Backend Tests (Already Verified):
```bash
# Test single course
curl "http://localhost:8000/api/v1/courses/enrollment/CMPT/354/D100?term=2025/fall"

# Test batch
curl -X POST "http://localhost:8000/api/v1/courses/enrollment/batch?term=2025/fall" \
  -H "Content-Type: application/json" \
  -d '[{"dept": "CMPT", "number": "354", "section": "D100"}]'
```

### Frontend Integration:
1. Open your app: `http://localhost:3000`
2. Add a course (e.g., CMPT 354)
3. Drag it to calendar and select a section
4. Course card now shows **live enrollment data**!
5. Data auto-refreshes every 5 minutes

## 📂 Files Modified

### Backend:
- `/backend/routers/courses.py` - Added enrollment endpoints
- `/backend/crawler/sfu_api_client.py` - Already had `get_enrollment_data()`

### Frontend:
- `/frontend/src/services/api.ts` - Added API methods
- `/frontend/src/hooks/useEnrollmentData.ts` - **NEW** React hook
- `/frontend/src/components/CourseList/CourseCard.tsx` - Uses live data
- `/frontend/src/components/CourseList/SectionSelectorModal.tsx` - Batch fetch

## 🎨 UI Behavior

### CourseCard:
- **Loading State**: "Loading..." while fetching
- **Success State**: Shows real numbers (e.g., "150/150")
- **Error State**: Shows "N/A" if fetch fails
- **Waitlist**: Shows "(5W)" if waitlist exists

### SectionSelectorModal:
- Fetches enrollment for all sections when opened
- Shows loading for each section
- Updates in real-time

## ⚙️ Configuration

### Refresh Interval:
Edit `/frontend/src/hooks/useEnrollmentData.ts`:
```typescript
// Change 5 minutes to your preference
const interval = setInterval(fetchEnrollment, 5 * 60 * 1000);
```

### Rate Limiting:
Edit `/backend/routers/courses.py`:
```python
client = SFUAPIClient(rate_limit_delay=0.2)  # seconds between requests
```

## 🎯 Benefits

1. **Always Current**: No more stale enrollment data
2. **No Manual Updates**: Data refreshes automatically
3. **Efficient**: Batch API reduces server load
4. **Reliable**: CourSys browse/info pages are public
5. **User-Friendly**: Loading states show progress

## 🔍 Monitoring

### Check Backend Logs:
```bash
# Backend terminal shows each enrollment fetch
# Example output:
# ✓ d100: 150/150 enrolled
# ✓ d200: 82/200 enrolled
```

### Browser Console:
- Open DevTools → Network tab
- See API calls to `/enrollment/` endpoints
- Monitor response times

## 🚨 Important Notes

1. **Rate Limiting**: CourSys may rate-limit excessive requests. Current delays (0.2-0.3s) are respectful.

2. **Term Format**: Must be "YYYY/season" (e.g., "2025/fall"). Update when term changes.

3. **Section Format**: Automatically converts D100 → d1 for CourSys URLs.

4. **No Static Data**: Frontend now fetches live data, mockData.ts enrollment fields are ignored.

5. **Backend Required**: Frontend needs backend server running on port 8000.

## 🎉 Result

Your app now shows **real-time enrollment data from CourSys** instead of static numbers! The data updates automatically every 5 minutes, giving users the most current information without manual refreshes.

**Try it now:**
1. Make sure backend is running: `http://localhost:8000/health`
2. Open frontend: `http://localhost:3000`
3. Add CMPT 354 D100 to your schedule
4. See live enrollment: "150/150" with real data from CourSys!
