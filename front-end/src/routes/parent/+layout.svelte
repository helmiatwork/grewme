<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { AppShell } from '$lib/components/layout';
  import { connectNotifications, disconnectNotifications, setInitialNotifications } from '$lib/stores/notifications.svelte';

  let { data, children } = $props();

  const navItems = [
    { label: 'My Children', href: '/parent/dashboard', icon: '👨‍👧‍👦' },
    { label: 'Messages', href: '/parent/messages', icon: '💬' },
    { label: 'Calendar', href: '/parent/calendar', icon: '📅' },
    { label: 'Profile', href: '/parent/profile', icon: '👤' }
  ];

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
