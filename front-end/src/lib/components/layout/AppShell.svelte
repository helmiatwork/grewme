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

<div class="flex h-screen bg-background overflow-hidden">
  <Sidebar items={navItems} />
  <div class="flex-1 flex flex-col min-w-0 min-h-0">
    <Navbar {user} />
    <main class="flex-1 min-h-0 overflow-auto p-6">
      {@render children()}
    </main>
  </div>
</div>
