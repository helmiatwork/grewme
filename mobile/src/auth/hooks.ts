import { useAuthStore } from './store';

export function useAuth() {
  const { token, userType, hydrated, clearAuth } = useAuthStore();
  return {
    isAuthenticated: !!token,
    isParent: userType === 'parent',
    isTeacher: userType === 'teacher',
    userType,
    hydrated,
    logout: clearAuth,
  };
}
