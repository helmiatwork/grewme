<script lang="ts">
  import { page } from '$app/state';

  interface NavItem {
    label: string;
    href: string;
    icon: string;
  }

  interface Props {
    items: NavItem[];
  }

  let { items }: Props = $props();
</script>

<aside class="w-64 bg-surface border-r border-slate-100 min-h-screen p-4 flex flex-col">
  <a href="/" class="flex items-center gap-2 px-3 py-2 mb-6">
    <span class="text-2xl font-bold text-primary">GrewMe</span>
  </a>

  <nav class="flex-1 space-y-1">
    {#each items as item}
      {@const active = page.url.pathname.startsWith(item.href)}
      <a
        href={item.href}
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
          {active
            ? 'bg-primary/10 text-primary'
            : 'text-text-muted hover:bg-slate-50 hover:text-text'}"
      >
        <span class="text-lg">{item.icon}</span>
        {item.label}
      </a>
    {/each}
  </nav>
</aside>
