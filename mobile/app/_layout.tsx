import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../src/auth/store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      await useAuthStore.getState().hydrate();
      await SplashScreen.hideAsync();
      setReady(true);
    }
    bootstrap();
  }, []);

  if (!ready) {
    return null;
  }

  return <Slot />;
}
