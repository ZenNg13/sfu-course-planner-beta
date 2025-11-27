import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CourseSection, CourseGroup } from '../types';

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
  setUserId: (userId: string | null) => void;
  loadScheduleFromBackend: () => Promise<void>;
  addCourseGroup: (group: CourseGroup) => void;
  removeCourseGroup: (courseKey: string) => void;
  scheduleSection: (courseKey: string, sectionId: string) => void;
  unscheduleSection: (courseKey: string) => void;
  clearAll: () => void;
  getTotalCredits: () => number;
  getScheduledCourses: () => CourseSection[];
  getUnscheduledGroups: () => CourseGroup[];
}

export const useCourseStore = create<CourseStore>()(
  persist(
    (set, get) => ({
  userId: null,
  courseGroups: [],
  
  setUserId: (userId: string | null) => {
    const currentUserId = get().userId;
    if (currentUserId !== userId) {
      // Clear courses when switching users
      set({ userId, courseGroups: [] });
      // Load schedule from backend for new user
      if (userId) {
        get().loadScheduleFromBackend();
      }
    } else {
      set({ userId });
    }
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
  
  addCourseGroup: (group: CourseGroup) => {
    set((state) => {
      const newGroups = [...state.courseGroups, group];
      saveScheduleToBackend(state.userId, newGroups);
      return { courseGroups: newGroups };
    });
  },
  
  removeCourseGroup: (courseKey: string) => {
    set((state) => {
      const newGroups = state.courseGroups.filter((g) => g.courseKey !== courseKey);
      saveScheduleToBackend(state.userId, newGroups);
      return { courseGroups: newGroups };
    });
  },
  
  scheduleSection: (courseKey: string, sectionId: string) => {
    set((state) => {
      const newGroups = state.courseGroups.map((g) =>
        g.courseKey === courseKey
          ? { ...g, isScheduled: true, scheduledSectionId: sectionId }
          : g
      );
      saveScheduleToBackend(state.userId, newGroups);
      return { courseGroups: newGroups };
    });
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
}),
    {
      name: 'course-storage',
      // Partition storage by userId to keep courses separate per user
      partialize: (state) => ({
        userId: state.userId,
        courseGroups: state.courseGroups,
      }),
    }
  )
);
