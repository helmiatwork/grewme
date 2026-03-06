export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  title: string;
  body: string;
  variant: ToastVariant;
  href?: string;
  dismissAfterMs: number;
}

const MAX_VISIBLE = 3;
const DEFAULT_DISMISS_MS = 30000;

let toasts = $state<Toast[]>([]);
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function generateId(): string {
  return `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getToasts() {
  return {
    get items() { return toasts; }
  };
}

export function addToast(options: {
  title: string;
  body: string;
  variant?: ToastVariant;
  href?: string;
  dismissAfterMs?: number;
}): string {
  const id = generateId();
  const toast: Toast = {
    id,
    title: options.title,
    body: options.body,
    variant: options.variant ?? 'info',
    href: options.href,
    dismissAfterMs: options.dismissAfterMs ?? DEFAULT_DISMISS_MS,
  };

  toasts = [toast, ...toasts];

  // Trim to max visible
  if (toasts.length > MAX_VISIBLE) {
    const removed = toasts.slice(MAX_VISIBLE);
    toasts = toasts.slice(0, MAX_VISIBLE);
    for (const r of removed) {
      clearTimer(r.id);
    }
  }

  // Auto-dismiss
  const timer = setTimeout(() => {
    removeToast(id);
  }, toast.dismissAfterMs);
  timers.set(id, timer);

  return id;
}

export function removeToast(id: string) {
  clearTimer(id);
  toasts = toasts.filter((t) => t.id !== id);
}

export function clearToasts() {
  for (const [id] of timers) {
    clearTimer(id);
  }
  toasts = [];
}

function clearTimer(id: string) {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
}
