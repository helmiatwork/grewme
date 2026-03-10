import { createConsumer } from '@rails/actioncable';
import type { Subscription, Consumer } from '@rails/actioncable';
import { addToast } from './toasts.svelte';
import * as m from '$lib/paraglide/messages.js';

export interface Notification {
  id: string;
  title: string;
  body: string;
  kind: string | null;
  params: Record<string, string> | null;
  notifiable_type: string | null;
  notifiable_id: string | null;
  feed_post_id: string | null;
  created_at: string;
}

/** Map of notification kind → { title, body } translation functions */
const NOTIFICATION_TRANSLATORS: Record<string, {
  title: (p: Record<string, string>) => string;
  body: (p: Record<string, string>) => string;
}> = {
  leave_request_created: {
    title: () => m.notif_leave_request_created_title(),
    body: (p) => m.notif_leave_request_created_body({
      parentName: p.parent_name ?? '',
      requestType: p.request_type ?? '',
      studentName: p.student_name ?? '',
      startDate: p.start_date ?? '',
      endDate: p.end_date ?? ''
    })
  },
  leave_request_reviewed: {
    title: (p) => m.notif_leave_request_reviewed_title({ decision: capitalize(p.decision ?? '') }),
    body: (p) => m.notif_leave_request_reviewed_body({
      requestType: p.request_type ?? '',
      studentName: p.student_name ?? '',
      startDate: p.start_date ?? '',
      endDate: p.end_date ?? '',
      decision: p.decision ?? ''
    })
  },
  teacher_leave_request_created: {
    title: () => m.notif_teacher_leave_request_created_title(),
    body: (p) => m.notif_teacher_leave_request_created_body({
      teacherName: p.teacher_name ?? '',
      requestType: p.request_type ?? '',
      startDate: p.start_date ?? '',
      endDate: p.end_date ?? ''
    })
  },
  teacher_leave_request_reviewed: {
    title: (p) => m.notif_teacher_leave_request_reviewed_title({ decision: capitalize(p.decision ?? '') }),
    body: (p) => m.notif_teacher_leave_request_reviewed_body({
      requestType: p.request_type ?? '',
      startDate: p.start_date ?? '',
      endDate: p.end_date ?? '',
      decision: p.decision ?? ''
    })
  },
  classroom_event_created: {
    title: (p) => m.notif_classroom_event_created_title({ eventTitle: p.event_title ?? '' }),
    body: (p) => m.notif_classroom_event_created_body({
      creatorName: p.creator_name ?? '',
      eventTitle: p.event_title ?? '',
      eventDate: p.event_date ?? '',
      classroomName: p.classroom_name ?? ''
    })
  },
  feed_post_tagged: {
    title: (p) => m.notif_feed_post_tagged_title({
      taggedChildren: Array.isArray(p.tagged_children) ? (p.tagged_children as unknown as string[]).join(', ') : (p.tagged_children ?? '')
    }),
    body: (p) => m.notif_feed_post_tagged_body({
      teacherName: p.teacher_name ?? '',
      classroomName: p.classroom_name ?? '',
      bodyPreview: p.body_preview ?? ''
    })
  },
  feed_post_created: {
    title: (p) => m.notif_feed_post_created_title({ classroomName: p.classroom_name ?? '' }),
    body: (p) => m.notif_feed_post_created_body({
      teacherName: p.teacher_name ?? '',
      bodyPreview: p.body_preview ?? ''
    })
  },
  exam_submitted: {
    title: () => m.notif_exam_submitted_title(),
    body: (p) => m.notif_exam_submitted_body({
      classroomName: p.classroom_name ?? '',
      examTitle: p.exam_title ?? '',
      pendingCount: String(p.pending_count ?? '0')
    })
  },
  exam_grading_complete: {
    title: () => m.notif_exam_grading_complete_title(),
    body: (p) => m.notif_exam_grading_complete_body({
      examTitle: p.exam_title ?? '',
      classroomName: p.classroom_name ?? ''
    })
  },
  new_message: {
    title: () => m.notif_new_message_title(),
    body: (p) => m.notif_new_message_body({
      senderName: p.sender_name ?? '',
      messagePreview: p.message_preview ?? ''
    })
  },
  new_comment: {
    title: () => m.notif_new_comment_title(),
    body: (p) => m.notif_new_comment_body({
      commenterName: p.commenter_name ?? '',
      commentPreview: p.comment_preview ?? ''
    })
  },
  health_checkup_reminder: {
    title: () => m.notif_health_checkup_reminder_title(),
    body: (p) => m.notif_health_checkup_reminder_body({
      classroomNames: p.classroom_names ?? ''
    })
  }
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Translate a notification using its kind + params.
 * Falls back to raw title/body if kind is unknown or missing.
 */
export function translateNotification(notif: Notification): { title: string; body: string } {
  if (notif.kind && NOTIFICATION_TRANSLATORS[notif.kind] && notif.params) {
    const translator = NOTIFICATION_TRANSLATORS[notif.kind];
    try {
      return {
        title: translator.title(notif.params),
        body: translator.body(notif.params)
      };
    } catch {
      // Fall back to raw values on translation error
    }
  }
  return { title: notif.title, body: notif.body };
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
        const notif = data.notification;
        notifications = [notif, ...notifications];
        unreadCount += 1;

        // Show toast with translated text
        const translated = translateNotification(notif);
        addToast({
          title: translated.title,
          body: translated.body,
          variant: 'info',
          href: notif.notifiable_type === 'FeedPost' && notif.notifiable_id
            ? `/posts/${notif.notifiable_id}`
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

export function setInitialNotifications(items: Notification[], count: number) {
  notifications = items;
  unreadCount = count;
}

export function setInitialCount(count: number) {
  unreadCount = count;
}

export function clearNotifications() {
  notifications = [];
  unreadCount = 0;
}
