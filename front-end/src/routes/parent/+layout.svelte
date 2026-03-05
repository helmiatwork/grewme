<script lang="ts">
  import { AppShell } from '$lib/components/layout';

  let { data, children } = $props();

  const navItems = [
    { label: 'My Children', href: '/parent/dashboard', icon: '👨‍👧‍👦' },
    { label: 'Profile', href: '/parent/profile', icon: '👤' }
  ];
</script>

<AppShell user={data.user} {navItems}>
  {@render children()}
</AppShell>
