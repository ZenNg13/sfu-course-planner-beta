import { create } from 'zustand';
import { CourseSection, CourseGroup } from '../types';

interface CourseStore {
  courseGroups: CourseGroup[];
  addCourseGroup: (group: CourseGroup) => void;
  removeCourseGroup: (courseKey: string) => void;
  scheduleSection: (courseKey: string, sectionId: string) => void;
  unscheduleSection: (courseKey: string) => void;
  clearAll: () => void;
  getTotalCredits: () => number;
  getScheduledCourses: () => CourseSection[];
  getUnscheduledGroups: () => CourseGroup[];
}

export const useCourseStore = create<CourseStore>((set, get) => ({
  courseGroups: [],
  
  addCourseGroup: (group: CourseGroup) => {
    set((state) => ({
      courseGroups: [...state.courseGroups, group],
    }));
  },
  
  removeCourseGroup: (courseKey: string) => {
    set((state) => ({
      courseGroups: state.courseGroups.filter((g) => g.courseKey !== courseKey),
    }));
  },
  
  scheduleSection: (courseKey: string, sectionId: string) => {
    set((state) => ({
      courseGroups: state.courseGroups.map((g) =>
        g.courseKey === courseKey
          ? { ...g, isScheduled: true, scheduledSectionId: sectionId }
          : g
      ),
    }));
  },
  
  unscheduleSection: (courseKey: string) => {
    set((state) => ({
      courseGroups: state.courseGroups.map((g) =>
        g.courseKey === courseKey
          ? { ...g, isScheduled: false, scheduledSectionId: undefined }
          : g
      ),
    }));
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
}));
