<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'info' | 'success' | 'warning' | 'error';
    children: Snippet;
  }

  let { variant = 'info', children }: Props = $props();

  const variants: Record<string, string> = {
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200'
  };
</script>

<div class="px-4 py-3 rounded-lg border {variants[variant]}" role="alert">
  {@render children()}
</div>
