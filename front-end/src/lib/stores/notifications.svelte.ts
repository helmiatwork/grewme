import { createConsumer } from '@rails/actioncable';
import type { Subscription, Consumer } from '@rails/actioncable';

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

export function getNotifications() {
  return {
    get items() { return notifications; },
    get unreadCount() { return unreadCount; },
    get connected() { return connected; }
  };
}

export function connectNotifications(accessToken: string) {
  if (consumer) return; // Already connected

  const wsUrl = `ws://localhost:3000/cable?token=${encodeURIComponent(accessToken)}`;
  consumer = createConsumer(wsUrl);

  subscription = consumer.subscriptions.create('NotificationsChannel', {
    connected() {
      connected = true;
    },

    disconnected() {
      connected = false;
    },

    received(data: { type: string; notification: Notification }) {
      if (data.type === 'new_notification') {
        notifications = [data.notification, ...notifications];
        unreadCount += 1;
      }
    }
  });
}

export function disconnectNotifications() {
  subscription?.unsubscribe();
  consumer?.disconnect();
  subscription = null;
  consumer = null;
  connected = false;
}

export function setInitialCount(count: number) {
  unreadCount = count;
}

export function clearNotifications() {
  notifications = [];
  unreadCount = 0;
}
