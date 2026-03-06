<script lang="ts">
  import { getToasts } from '$lib/stores/toasts.svelte';
  import Toast from './Toast.svelte';

  const toasts = getToasts();
</script>

{#if toasts.items.length > 0}
  <div
    class="fixed top-4 right-4 z-50 flex flex-col gap-3"
    aria-live="polite"
    aria-label="Notifications"
  >
    {#each toasts.items as toast (toast.id)}
      <Toast {toast} />
    {/each}
  </div>
{/if}
