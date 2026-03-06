<script lang="ts">
  import { AppShell } from '$lib/components/layout';

  let { data, children } = $props();

  const navItems = [
    { label: 'Dashboard', href: '/school/dashboard', icon: '🏫' },
    { label: 'Classrooms', href: '/school/classrooms', icon: '🏠' },
    { label: 'Teachers', href: '/school/teachers', icon: '👩‍🏫' },
    { label: 'Students', href: '/school/students', icon: '👦' },
    { label: 'Feed', href: '/school/feed', icon: '📢' },
    { label: 'Curriculum', href: '/school/curriculum', icon: '📚' },
    { label: 'Yearly Plan', href: '/school/curriculum/yearly', icon: '📋' },
    { label: 'Exams', href: '/school/exams', icon: '📝' },
    { label: 'Calendar', href: '/school/calendar', icon: '📅' },
    { label: 'Profile', href: '/school/profile', icon: '👤' }
  ];
</script>

<AppShell user={data.user} {navItems}>
  {@render children()}
</AppShell>
