<script lang="ts">
  import { Card } from '$lib/components/ui';

  let { data } = $props();
</script>

<svelte:head>
  <title>Classrooms — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">Classrooms</h1>

  {#if data.classrooms.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">No classrooms found</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each data.classrooms as classroom}
        <Card>
          {#snippet children()}
            <h3 class="text-lg font-semibold text-text">{classroom.name}</h3>
            {#if classroom.studentCount !== undefined}
              <p class="text-sm text-text-muted mt-1">{classroom.studentCount} students</p>
            {/if}
          {/snippet}
        </Card>
      {/each}
    </div>
  {/if}
</div>
