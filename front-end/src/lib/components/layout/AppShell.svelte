<script lang="ts">
  import type { Snippet } from 'svelte';
  import Sidebar from './Sidebar.svelte';
  import Navbar from './Navbar.svelte';
  import type { SessionUser } from '$lib/api/types';

  interface NavItem {
    label: string;
    href: string;
    icon: string;
  }

  interface Props {
    user: SessionUser;
    navItems: NavItem[];
    children: Snippet;
  }

  let { user, navItems, children }: Props = $props();
</script>

<div class="flex min-h-screen bg-background">
  <Sidebar items={navItems} />
  <div class="flex-1 flex flex-col">
    <Navbar {user} />
    <main class="flex-1 p-6">
      {@render children()}
    </main>
  </div>
</div>
