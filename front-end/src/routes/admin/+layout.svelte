<script lang="ts">
  import { AppShell } from '$lib/components/layout';
  import * as m from '$lib/paraglide/messages.js';

  let { data, children } = $props();

  const navItems = $derived([
    { label: m.nav_dashboard(), href: data.user.type === 'Teacher' ? '/teacher/dashboard' : '/parent/dashboard', icon: '🏠' },
    { label: m.nav_permissions(), href: '/admin/permissions', icon: '🔐' }
  ]);
</script>

<AppShell user={data.user} {navItems}>
  {@render children()}
</AppShell>
