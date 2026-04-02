import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_TYPE_KEY = 'user_type';

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
    SecureStore.setItemAsync(USER_TYPE_KEY, userType);
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
    SecureStore.deleteItemAsync(USER_TYPE_KEY);
    set({
      token: null,
      userType: null,
      activeClassroomId: null,
      activeSchoolId: null,
    });
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    const userType = await SecureStore.getItemAsync(USER_TYPE_KEY);
    set({
      token: token ?? null,
      userType: (userType as 'parent' | 'teacher') ?? null,
      hydrated: true,
    });
  },
}));
