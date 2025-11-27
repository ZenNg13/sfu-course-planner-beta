import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCourseStore } from './courseStore';

interface AuthState {
  token: string | null;
  email: string | null;
  userId: number | null;
  isAuthenticated: boolean;
  login: (token: string, email: string, userId: number) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      userId: null,
      isAuthenticated: false,
      login: (token: string, email: string, userId: number) => {
        set({ token, email, userId, isAuthenticated: true });
        localStorage.setItem('token', token);
        // Set userId in courseStore to load user-specific courses
        useCourseStore.getState().setUserId(userId.toString());
      },
      logout: () => {
        set({ token: null, email: null, userId: null, isAuthenticated: false });
        localStorage.removeItem('token');
        // Clear courses when logging out
        useCourseStore.getState().clearAll();
        useCourseStore.getState().setUserId(null);
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
