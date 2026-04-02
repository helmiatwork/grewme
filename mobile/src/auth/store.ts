import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const AUTH_TOKEN_KEY = 'auth_token';

export interface AuthState {
  token: string | null;
  userType: 'parent' | 'teacher' | null;
  activeClassroomId: string | null;
  activeSchoolId: string | null;
  hydrated: boolean;
  setAuth: (token: string, userType: 'parent' | 'teacher') => void;
  setActiveClassroomId: (id: string) => void;
  setActiveSchoolId: (id: string) => void;
  clearAuth: () => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userType: null,
  activeClassroomId: null,
  activeSchoolId: null,
  hydrated: false,

  setAuth: (token, userType) => {
    SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    set({ token, userType });
  },

  setActiveClassroomId: (id) => {
    set({ activeClassroomId: id });
  },

  setActiveSchoolId: (id) => {
    set({ activeSchoolId: id });
  },

  clearAuth: () => {
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    set({
      token: null,
      userType: null,
      activeClassroomId: null,
      activeSchoolId: null,
    });
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    set({ token: token ?? null, hydrated: true });
  },
}));
