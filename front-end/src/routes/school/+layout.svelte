<script lang="ts">
  import { AppShell } from '$lib/components/layout';
  import * as m from '$lib/paraglide/messages.js';

  let { data, children } = $props();

  const navItems = $derived([
    { label: m.nav_dashboard(), href: '/school/dashboard', icon: '🏫' },
    { label: m.nav_classrooms(), href: '/school/classrooms', icon: '🏠' },
    { label: m.nav_teachers(), href: '/school/teachers', icon: '👩‍🏫' },
    { label: m.nav_students(), href: '/school/students', icon: '👦' },
    { label: m.nav_feed(), href: '/school/feed', icon: '📢' },
    { label: m.nav_curriculum(), href: '/school/curriculum', icon: '📚' },
    { label: m.nav_yearly_plan(), href: '/school/curriculum/yearly', icon: '📋' },
    { label: m.nav_exams(), href: '/school/exams', icon: '📝' },
    { label: m.nav_calendar(), href: '/school/calendar', icon: '📅' },
    { label: m.nav_settings(), href: '/school/settings/academic-years', icon: '⚙️' },
    { label: m.nav_profile(), href: '/school/profile', icon: '👤' }
  ]);
</script>

<AppShell user={data.user} {navItems}>
  {@render children()}
</AppShell>
