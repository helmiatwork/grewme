<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    class?: string;
    accent?: string;
    hover?: boolean;
    children: Snippet;
    header?: Snippet;
    footer?: Snippet;
  }

  let { class: className = '', accent, hover = false, children, header, footer }: Props = $props();
</script>

<div
  class="bg-surface rounded-xl shadow-sm border border-slate-100 overflow-hidden
    {hover ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}
    {className}"
>
  {#if header}
    <div class="px-6 py-4 border-b border-slate-100">
      {@render header()}
    </div>
  {/if}
  <div class="px-6 py-4">
    {@render children()}
  </div>
  {#if footer}
    <div class="px-6 py-3 bg-slate-50 border-t border-slate-100">
      {@render footer()}
    </div>
  {/if}
</div>
