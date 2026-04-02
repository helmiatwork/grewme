import { router } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../src/auth/store';

export default function Index() {
  const token = useAuthStore((s) => s.token);
  const userType = useAuthStore((s) => s.userType);
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    if (!token) {
      router.replace('/(auth)/login');
      return;
    }

    if (userType === 'parent') {
      router.replace('/(app)/parent/children');
    } else if (userType === 'teacher') {
      router.replace('/(app)/teacher');
    } else {
      router.replace('/(auth)/login');
    }
  }, [hydrated, token, userType]);

  return null;
}
