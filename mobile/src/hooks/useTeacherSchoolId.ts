import { useAuthStore } from '../auth/store';

/**
 * Hook to get schoolId for teacher curriculum screens.
 * Teachers have activeSchoolId set on their Zustand auth store (populated by dashboard).
 */
export function useTeacherSchoolId() {
  const activeSchoolId = useAuthStore((s) => s.activeSchoolId);
  return { schoolId: activeSchoolId };
}
