<script lang="ts">
  import { page } from '$app/state';
  import { Button } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';
</script>

<svelte:head>
  <title>Error — GrewMe</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="text-center">
    <h1 class="text-6xl font-bold text-primary mb-4">{page.status}</h1>
    <p class="text-xl text-text mb-2">
      {#if page.status === 404}
        {m.error_404()}
      {:else if page.status === 403}
        {m.error_403()}
      {:else}
        {m.error_generic()}
      {/if}
    </p>
    <p class="text-text-muted mb-8">{page.error?.message ?? 'An unexpected error occurred.'}</p>
    <div class="flex gap-3 justify-center">
      <Button onclick={() => history.back()} variant="outline">{m.error_go_back()}</Button>
      <a href="/"><Button>{m.error_home()}</Button></a>
    </div>
  </div>
</div>
