<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface Props extends HTMLInputAttributes {
    label?: string;
    error?: string;
    value?: string;
  }

  let { label, error, value = $bindable(''), ...rest }: Props = $props();
</script>

<div class="space-y-1">
  {#if label}
    <label class="block text-sm font-medium text-text" for={rest.id}>
      {label}
    </label>
  {/if}
  <input
    class="w-full px-3 py-2 rounded-lg border transition-colors
      focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
      {error ? 'border-red-300 focus:ring-red-500/50 focus:border-red-500' : 'border-slate-200'}"
    bind:value
    {...rest}
  />
  {#if error}
    <p class="text-sm text-red-500">{error}</p>
  {/if}
</div>
