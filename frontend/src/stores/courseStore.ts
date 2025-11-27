import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CourseSection, CourseGroup } from '../types';

// Helper to check for time conflicts
const hasTimeConflict = (section1: CourseSection, section2: CourseSection): boolean => {
  for (const sched1 of section1.schedule) {
    for (const sched2 of section2.schedule) {
      // Check if same day
      if (sched1.day === sched2.day) {
        // Convert time strings to minutes for comparison
        const start1 = timeToMinutes(sched1.startTime);
        const end1 = timeToMinutes(sched1.endTime);
        const start2 = timeToMinutes(sched2.startTime);
        const end2 = timeToMinutes(sched2.endTime);
        
        // Check if times overlap
        if (start1 < end2 && start2 < end1) {
          return true;
        }
      }
    }
  }
  return false;
};

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper to save schedule to backend
const saveScheduleToBackend = async (userId: string | null, courseGroups: CourseGroup[]) => {
  if (!userId) return;
  
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    await fetch('http://localhost:8000/api/v1/user/schedule', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ courseGroups })
    });
  } catch (error) {
    console.error('Failed to save schedule:', error);
  }
};

interface CourseStore {
  userId: string | null;
  courseGroups: CourseGroup[];
  completedCourses: string[];
  setUserId: (userId: string | null) => void;
  setCompletedCourses: (courses: string[]) => void;
  loadScheduleFromBackend: () => Promise<void>;
  addCourseGroup: (group: CourseGroup) => Promise<{success: boolean; error?: string}>;
  removeCourseGroup: (courseKey: string) => void;
  scheduleSection: (courseKey: string, sectionId: string) => {success: boolean; error?: string};
  unscheduleSection: (courseKey: string) => void;
  clearAll: () => void;
  getTotalCredits: () => number;
  getScheduledCourses: () => CourseSection[];
  getUnscheduledGroups: () => CourseGroup[];
  checkPrerequisites: (courseKey: string) => Promise<{valid: boolean; missing: string[]}>;
}

export const useCourseStore = create<CourseStore>()(
  persist(
    (set, get) => ({
  userId: null,
  courseGroups: [],
  completedCourses: [],
  
  setUserId: (userId: string | null) => {
    const currentUserId = get().userId;
    if (currentUserId !== userId) {
      // Clear courses when switching users
      set({ userId, courseGroups: [], completedCourses: [] });
      // Load schedule from backend for new user
      if (userId) {
        get().loadScheduleFromBackend();
      }
    } else {
      set({ userId });
    }
  },
  
  setCompletedCourses: (courses: string[]) => {
    set({ completedCourses: courses });
  },
  
  loadScheduleFromBackend: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/user/schedule', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.scheduledCourses?.courseGroups) {
          set({ courseGroups: data.scheduledCourses.courseGroups });
        }
      }
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  },
  
  addCourseGroup: async (group: CourseGroup): Promise<{success: boolean; error?: string}> => {
    // Check prerequisites first
    const prereqCheck = await get().checkPrerequisites(group.courseKey);
    if (!prereqCheck.valid) {
      return {
        success: false,
        error: `Missing prerequisites: ${prereqCheck.missing.join(', ')}`
      };
    }
    
    // Check if course already exists
    const exists = get().courseGroups.some(g => g.courseKey === group.courseKey);
    if (exists) {
      return { success: false, error: 'Course already added' };
    }
    
    set((state) => {
      const newGroups = [...state.courseGroups, group];
      saveScheduleToBackend(state.userId, newGroups);
      return { courseGroups: newGroups };
    });
    
    return { success: true };
  },
  
  removeCourseGroup: (courseKey: string) => {
    set((state) => {
      const newGroups = state.courseGroups.filter((g) => g.courseKey !== courseKey);
      saveScheduleToBackend(state.userId, newGroups);
      return { courseGroups: newGroups };
    });
  },
  
  scheduleSection: (courseKey: string, sectionId: string): {success: boolean; error?: string} => {
    const state = get();
    const group = state.courseGroups.find(g => g.courseKey === courseKey);
    if (!group) return { success: false, error: 'Course not found' };
    
    const section = group.sections.find(s => s.id === sectionId);
    if (!section) return { success: false, error: 'Section not found' };
    
    // Check for time conflicts with already scheduled courses
    const scheduledCourses = state.getScheduledCourses();
    for (const scheduled of scheduledCourses) {
      if (hasTimeConflict(section, scheduled)) {
        return {
          success: false,
          error: `Time conflict with ${scheduled.dept} ${scheduled.number} (${scheduled.section})`
        };
      }
    }
    
    set((state) => {
      const newGroups = state.courseGroups.map((g) =>
        g.courseKey === courseKey
          ? { ...g, isScheduled: true, scheduledSectionId: sectionId }
          : g
      );
      saveScheduleToBackend(state.userId, newGroups);
      return { courseGroups: newGroups };
    });
    
    return { success: true };
  },
  
  unscheduleSection: (courseKey: string) => {
    set((state) => {
      const newGroups = state.courseGroups.map((g) =>
        g.courseKey === courseKey
          ? { ...g, isScheduled: false, scheduledSectionId: undefined }
          : g
      );
      saveScheduleToBackend(state.userId, newGroups);
      return { courseGroups: newGroups };
    });
  },
  
  clearAll: () => {
    set({ courseGroups: [] });
  },
  
  getTotalCredits: () => {
    const { courseGroups } = get();
    return courseGroups
      .filter((g) => g.isScheduled && g.scheduledSectionId)
      .reduce((sum, group) => {
        const section = group.sections.find((s) => s.id === group.scheduledSectionId);
        return sum + (section?.credits || 0);
      }, 0);
  },
  
  getScheduledCourses: () => {
    const { courseGroups } = get();
    return courseGroups
      .filter((g) => g.isScheduled && g.scheduledSectionId)
      .map((g) => g.sections.find((s) => s.id === g.scheduledSectionId)!)
      .filter(Boolean);
  },
  
  getUnscheduledGroups: () => {
    const { courseGroups } = get();
    return courseGroups.filter((g) => !g.isScheduled);
  },
  
  checkPrerequisites: async (courseKey: string): Promise<{valid: boolean; missing: string[]}> => {
    const { completedCourses } = get();
    const token = localStorage.getItem('token');
    
    if (!token) {
      // If not logged in, allow all courses
      return { valid: true, missing: [] };
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/validate/prereqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          target_course: courseKey,
          transcript: completedCourses
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          valid: data.is_valid,
          missing: data.missing_courses || []
        };
      }
    } catch (error) {
      console.error('Failed to check prerequisites:', error);
    }
    
    // On error, allow the course (fail open)
    return { valid: true, missing: [] };
  },
}),
    {
      name: 'course-storage',
      // Partition storage by userId to keep courses separate per user
      partialize: (state) => ({
        userId: state.userId,
        courseGroups: state.courseGroups,
        completedCourses: state.completedCourses,
      }),
    }
  )
);
