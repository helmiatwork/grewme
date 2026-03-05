<script lang="ts">
  import { Card } from '$lib/components/ui';
  import { RadarChart } from '$lib/components/charts';

  let { data } = $props();
</script>

<svelte:head>
  <title>My Children — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">My Children</h1>

  {#if data.children.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">No children linked yet</p>
      <p class="text-sm mt-1">Ask your child's teacher to link your account.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {#each data.children as child}
        <a href="/parent/children/{child.id}">
          <Card hover>
            <h3 class="text-lg font-semibold text-text mb-3">{child.name}</h3>
            {#if child.radar}
              <RadarChart skills={child.radar} label={child.name} size="sm" />
            {:else}
              <p class="text-sm text-text-muted text-center py-8">No data yet</p>
            {/if}
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
