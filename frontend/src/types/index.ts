export interface CourseSection {
  id: string;
  dept: string; // CMPT
  number: string; // 295
  section: string; // D100
  title: string; // Introduction to Computer Systems
  instructor: string;
  credits: number;
  location: string;
  schedule: {
    day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
    startTime: string; // "14:30"
    endTime: string; // "15:20"
    type: 'Lecture' | 'Lab' | 'Tutorial';
  }[];
  stats: {
    enrolled: string; // "195/195"
    waitlist: string; // "(9W)"
    profRating: string; // "2.2/5"
    avgGrade: string; // "B-"
    textbookISBN: string; // "9780128203316" or "None"
    profRMPId?: string; // RateMyProfessor ID
  };
  color: string; // Hex code for the calendar block
}

export interface CourseGroup {
  courseKey: string; // "CMPT-125"
  dept: string;
  number: string;
  title: string;
  sections: CourseSection[];
  isScheduled: boolean;
  scheduledSectionId?: string | null; // The section that's currently scheduled
  offeringFrequency?: {
    label: string;
    color: string;
  };
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: CourseSection;
}

export interface CourseStore {
  courseGroups: CourseGroup[];
  addCourseGroup: (group: CourseGroup) => void;
  removeCourseGroup: (courseKey: string) => void;
  scheduleSection: (courseKey: string, sectionId: string, combinedSection?: CourseSection) => void;
  unscheduleSection: (courseKey: string) => void;
  clearAll: () => void;
  getTotalCredits: () => number;
  getScheduledCourses: () => CourseSection[];
  getUnscheduledGroups: () => CourseGroup[];
}
