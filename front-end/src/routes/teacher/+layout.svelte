<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { AppShell } from '$lib/components/layout';
  import { connectNotifications, disconnectNotifications, setInitialCount } from '$lib/stores/notifications.svelte';

  let { data, children } = $props();

  const navItems = [
    { label: 'Dashboard', href: '/teacher/dashboard', icon: '🏠' },
    { label: 'Class Feed', href: '/teacher/feed', icon: '📢' },
    { label: 'Messages', href: '/teacher/messages', icon: '💬' },
    { label: 'Calendar', href: '/teacher/calendar', icon: '📅' },
    { label: 'Profile', href: '/teacher/profile', icon: '👤' }
  ];

  onMount(async () => {
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `query { unreadNotificationCount }` })
      });
      const json = await res.json();
      if (json.data?.unreadNotificationCount != null) {
        setInitialCount(json.data.unreadNotificationCount);
      }
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
