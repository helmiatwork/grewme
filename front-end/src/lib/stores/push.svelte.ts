import { requestPushToken, onForegroundMessage } from '$lib/firebase';
import { addToast } from './toasts.svelte';

let registered = $state(false);
let supported = $state(false);

export function getPushState() {
  return {
    get registered() { return registered; },
    get supported() { return supported; },
  };
}

/**
 * Initialize push notifications:
 * 1. Request permission + get FCM token
 * 2. Register token with backend via GraphQL
 * 3. Listen for foreground messages → show toast
 */
export async function initPush() {
  // Check browser support
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
  supported = true;

  const token = await requestPushToken();
  if (!token) return;

  // Register token with backend
  try {
    const platform = detectPlatform();
    await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation RegisterPushDevice($token: String!, $platform: String!) {
          registerPushDevice(token: $token, platform: $platform) {
            pushDevice { id }
            errors { message }
          }
        }`,
        variables: { token, platform },
      }),
    });
    registered = true;
  } catch {
    // Silent fail — push is best-effort
  }

  // Listen for foreground messages → show toast
  onForegroundMessage((payload) => {
    const { title, body } = payload.notification || {};
    if (title) {
      addToast({
        title,
        body: body || '',
        variant: 'info',
      });
    }
  });
}

/**
 * Unregister push device (call on logout).
 */
export async function unregisterPush(token: string) {
  try {
    await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation UnregisterPushDevice($token: String!) {
          unregisterPushDevice(token: $token) {
            success
            errors { message }
          }
        }`,
        variables: { token },
      }),
    });
    registered = false;
  } catch {
    // Silent fail
  }
}

function detectPlatform(): string {
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  return 'web';
}
