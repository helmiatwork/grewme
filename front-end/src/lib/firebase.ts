import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

// Firebase config — replace with your project's config from Firebase Console
// Settings > General > Your apps > Firebase SDK snippet
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function isConfigured(): boolean {
  return !!firebaseConfig.projectId && !!firebaseConfig.apiKey;
}

export function initFirebase(): FirebaseApp | null {
  if (app) return app;
  if (!isConfigured()) return null;

  app = initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseMessaging(): Messaging | null {
  if (messaging) return messaging;
  const firebaseApp = initFirebase();
  if (!firebaseApp) return null;

  try {
    messaging = getMessaging(firebaseApp);
    return messaging;
  } catch {
    // Messaging not supported (e.g., no service worker, no HTTPS)
    return null;
  }
}

/**
 * Request notification permission and get FCM token.
 * Returns null if permission denied or Firebase not configured.
 */
export async function requestPushToken(): Promise<string | null> {
  const msg = getFirebaseMessaging();
  if (!msg) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const vapidKey = import.meta.env.PUBLIC_FIREBASE_VAPID_KEY || '';
    if (!vapidKey) return null;

    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js'),
    });

    return token;
  } catch (err) {
    console.error('[Firebase] Failed to get push token:', err);
    return null;
  }
}

/**
 * Listen for foreground messages (when app is open).
 * Background messages are handled by the service worker.
 */
export function onForegroundMessage(callback: (payload: any) => void): (() => void) | null {
  const msg = getFirebaseMessaging();
  if (!msg) return null;

  return onMessage(msg, callback);
}
