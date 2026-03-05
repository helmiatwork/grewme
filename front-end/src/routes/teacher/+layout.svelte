<script lang="ts">
  import { AppShell } from '$lib/components/layout';

  let { data, children } = $props();

  const navItems = [
    { label: 'Dashboard', href: '/teacher/dashboard', icon: '🏠' },
    { label: 'Score Entry', href: '/teacher/scores', icon: '📝' },
    { label: 'Class Feed', href: '/teacher/feed', icon: '📢' }
  ];
</script>

<AppShell user={data.user} {navItems}>
  {@render children()}
</AppShell>
