<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { AppShell } from '$lib/components/layout';
  import { connectNotifications, disconnectNotifications, setInitialCount } from '$lib/stores/notifications.svelte';

  let { data, children } = $props();

  const navItems = [
    { label: 'My Children', href: '/parent/dashboard', icon: '👨‍👧‍👦' },
    { label: 'Messages', href: '/parent/messages', icon: '💬' },
    { label: 'Calendar', href: '/parent/calendar', icon: '📅' },
    { label: 'Profile', href: '/parent/profile', icon: '👤' }
  ];

  onMount(async () => {
    // Fetch initial unread count
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { unreadNotificationCount }`
        })
      });
      const json = await res.json();
      if (json.data?.unreadNotificationCount != null) {
        setInitialCount(json.data.unreadNotificationCount);
      }
    } catch { /* ignore */ }

    // Connect WebSocket for real-time notifications
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
