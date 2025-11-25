# SFU Scheduler Frontend

A pixel-perfect clone of sfuscheduler.ca built with React, TypeScript, and Tailwind CSS.

## 🎨 Features

- **Dark Mode UI** - Modern dark theme matching SFU Scheduler
- **Weekly Calendar View** - Interactive course scheduling with react-big-calendar
- **Course Management** - Add, remove, and organize courses
- **Real-time Statistics** - View enrollment counts, professor ratings, average grades, and textbook info
- **Expandable Course Cards** - Detailed course information with accordion UI
- **Responsive Design** - Mobile-friendly layout

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (Dark Mode)
- **Icons**: lucide-react
- **Calendar**: react-big-calendar
- **State Management**: Zustand
- **Date Utilities**: date-fns

## 🚀 Getting Started

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── GlobalHeader.tsx      # SFU red header with icons
│   │   │   ├── ControlBar.tsx        # Search and filters
│   │   │   ├── FooterActionBar.tsx   # Bottom action buttons
│   │   │   └── MainLayout.tsx        # Main 2-column layout
│   │   ├── Calendar/
│   │   │   └── WeeklyCalendar.tsx    # Week view calendar
│   │   └── CourseList/
│   │       ├── CourseCard.tsx        # Expandable course cards
│   │       └── CourseList.tsx        # Course list container
│   ├── stores/
│   │   └── courseStore.ts            # Zustand state management
│   ├── types/
│   │   └── index.ts                  # TypeScript interfaces
│   ├── data/
│   │   └── mockData.ts               # Mock course data
│   ├── App.tsx                       # Main app component
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Global styles + Tailwind
├── public/                           # Static assets
├── index.html                        # HTML entry
├── vite.config.ts                    # Vite configuration
├── tailwind.config.js                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json                      # Dependencies
```

## 🎨 Color Palette

- **SFU Red**: `#A6192E` - Header and primary buttons
- **Dark Background**: `#1a1a1a` - Main background
- **Dark Card**: `#2d2d2d` - Card backgrounds
- **Lecture Purple**: `#5B2C6F` - Lecture blocks
- **Lab Green**: `#00703c` - Lab blocks

## 📦 Key Components

### GlobalHeader
- SFU branding
- Navigation icons (Info, Help, Save, Settings)

### ControlBar
- Term selector dropdown
- Department selector
- Course search with suggestions
- Filter button

### WeeklyCalendar
- Monday-Friday week view
- Color-coded course blocks
- Time slots from 8 AM - 9 PM
- Drag-and-drop support (UI only)

### CourseCard
- Expandable accordion design
- 4-column statistics grid:
  - Enrolled count with waitlist
  - Professor rating (with RMP link)
  - Average grade (with CourseDiggers link)
  - Textbook ISBN (with SFU bookstore link)
- Schedule information
- Remove button

### FooterActionBar
- Total credits counter
- Save/Load/Export buttons
- Clear all button

## 🔧 State Management

The app uses Zustand for state management with the following store:

```typescript
interface CourseStore {
  selectedCourses: CourseSection[];
  unscheduledCourses: CourseSection[];
  addCourse: (course: CourseSection) => void;
  removeCourse: (courseId: string) => void;
  clearAll: () => void;
  getTotalCredits: () => number;
}
```

## 📝 Course Data Structure

```typescript
interface CourseSection {
  id: string;
  dept: string;              // e.g., "CMPT"
  number: string;            // e.g., "295"
  section: string;           // e.g., "D100"
  title: string;
  instructor: string;
  credits: number;
  location: string;
  schedule: {
    day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
    startTime: string;       // "14:30"
    endTime: string;         // "15:20"
    type: 'Lecture' | 'Lab' | 'Tutorial';
  }[];
  stats: {
    enrolled: string;        // "195/195"
    waitlist: string;        // "(9W)"
    profRating: string;      // "2.2/5"
    avgGrade: string;        // "B-"
    textbookISBN: string;
  };
  color: string;             // Hex color for calendar
}
```

## 🔗 Backend Integration

The frontend is configured to proxy API requests to the backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
    },
  },
}
```

Backend endpoints (to be implemented):
- `GET /api/courses` - Fetch all courses
- `POST /api/courses/search` - Search courses
- `GET /api/schedule` - Get saved schedule
- `POST /api/schedule` - Save schedule
- `PUT /api/schedule` - Update schedule
- `DELETE /api/schedule` - Delete schedule

## 🚧 Future Enhancements

- [ ] Connect to real SFU API
- [ ] Implement authentication
- [ ] Save/Load schedules from backend
- [ ] Export to calendar formats (iCal, Google Calendar)
- [ ] Real drag-and-drop functionality
- [ ] Course conflict detection
- [ ] Prerequisite checking
- [ ] Mobile app version

## 📄 License

This project is for educational purposes only.

## 🙏 Credits

UI Design inspired by [sfuscheduler.ca](https://sfuscheduler.ca)
