<script lang="ts">
  import { AppShell } from '$lib/components/layout';

  let { data, children } = $props();

  const navItems = [
    { label: 'Dashboard', href: data.user.type === 'Teacher' ? '/teacher/dashboard' : '/parent/dashboard', icon: '🏠' },
    { label: 'Permissions', href: '/admin/permissions', icon: '🔐' }
  ];
</script>

<AppShell user={data.user} {navItems}>
  {@render children()}
</AppShell>
