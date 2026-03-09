<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { AppShell } from '$lib/components/layout';
  import { connectNotifications, disconnectNotifications, setInitialNotifications } from '$lib/stores/notifications.svelte';
  import * as m from '$lib/paraglide/messages.js';

  let { data, children } = $props();

  const navItems = $derived([
    { label: m.nav_dashboard(), href: '/teacher/dashboard', icon: '🏠' },
    { label: m.nav_class_feed(), href: '/teacher/feed', icon: '📢' },
    { label: m.nav_messages(), href: '/teacher/messages', icon: '💬' },
    { label: m.nav_calendar(), href: '/teacher/calendar', icon: '📅' },
    { label: m.nav_curriculum(), href: '/teacher/curriculum', icon: '📚' },
    { label: m.nav_yearly_plan(), href: '/teacher/curriculum/yearly', icon: '📋' },
    { label: m.nav_exams(), href: '/teacher/exams', icon: '📝' },
    { label: m.nav_attendance(), href: '/teacher/attendance', icon: '✅' },
    { label: m.leave_requests_title(), href: '/teacher/leave-requests', icon: '📋' },
    { label: m.nav_profile(), href: '/teacher/profile', icon: '👤' }
  ]);

  onMount(async () => {
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query {
            unreadNotificationCount
            notifications(first: 20) {
              nodes { id title body notifiableType notifiableId read createdAt }
            }
          }`
        })
      });
      const json = await res.json();
      const items = (json.data?.notifications?.nodes ?? []).map((n: any) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        feed_post_id: n.notifiableType === 'FeedPost' ? n.notifiableId : null,
        created_at: n.createdAt,
      }));
      setInitialNotifications(items, json.data?.unreadNotificationCount ?? 0);
    } catch { /* ignore */ }

    if (data.accessToken) {
      connectNotifications(data.accessToken, data.cableUrl);
    }
  });

  onDestroy(() => {
    disconnectNotifications();
  });
</script>

<AppShell user={data.user} {navItems}>
  {@render children()}
</AppShell>
