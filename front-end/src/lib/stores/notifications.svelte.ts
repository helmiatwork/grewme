import { createConsumer } from '@rails/actioncable';
import type { Subscription, Consumer } from '@rails/actioncable';
import { addToast } from './toasts.svelte';

export interface Notification {
  id: string;
  title: string;
  body: string;
  feed_post_id: string;
  created_at: string;
}

// Reactive notification state
let notifications = $state<Notification[]>([]);
let unreadCount = $state(0);
let connected = $state(false);

let consumer: Consumer | null = null;
let subscription: Subscription | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;

// Stored config for reconnection
let storedCableUrl: string = '';

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY_MS = 2000;
const MAX_RECONNECT_DELAY_MS = 30000;

export function getNotifications() {
  return {
    get items() { return notifications; },
    get unreadCount() { return unreadCount; },
    get connected() { return connected; }
  };
}

export function connectNotifications(accessToken: string, cableUrl?: string) {
  if (consumer) return; // Already connected

  storedCableUrl = cableUrl || 'ws://localhost:3004/cable';
  reconnectAttempts = 0;
  createConnection(accessToken);
}

function createConnection(accessToken: string) {
  // Clean up any existing connection
  teardown();

  const wsUrl = `${storedCableUrl}?token=${encodeURIComponent(accessToken)}`;
  consumer = createConsumer(wsUrl);

  subscription = consumer.subscriptions.create('NotificationsChannel', {
    connected() {
      connected = true;
      reconnectAttempts = 0; // Reset on successful connection
    },

    disconnected() {
      connected = false;
      scheduleReconnect();
    },

    rejected() {
      // Server rejected the subscription (likely bad token)
      connected = false;
      scheduleReconnect();
    },

    received(data: { type: string; notification: Notification }) {
      if (data.type === 'new_notification') {
        notifications = [data.notification, ...notifications];
        unreadCount += 1;

        // Show toast popup for realtime notification
        addToast({
          title: data.notification.title,
          body: data.notification.body,
          variant: 'info',
          href: data.notification.feed_post_id
            ? `/posts/${data.notification.feed_post_id}`
            : undefined,
        });
      }
    }
  });
}

async function scheduleReconnect() {
  if (reconnectTimer) return; // Already scheduled
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;

  reconnectAttempts++;
  const delay = Math.min(
    BASE_RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttempts - 1),
    MAX_RECONNECT_DELAY_MS
  );

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;

    // Refresh the access token before reconnecting
    const freshToken = await refreshAccessToken();
    if (freshToken) {
      createConnection(freshToken);
    } else {
      // Token refresh failed — try again with backoff
      scheduleReconnect();
    }
  }, delay);
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/refresh', { method: 'POST' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.accessToken ?? null;
  } catch {
    return null;
  }
}

function teardown() {
  subscription?.unsubscribe();
  consumer?.disconnect();
  subscription = null;
  consumer = null;
}

export function disconnectNotifications() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect
  teardown();
  connected = false;
}

export function setInitialCount(count: number) {
  unreadCount = count;
}

export function clearNotifications() {
  notifications = [];
  unreadCount = 0;
}
