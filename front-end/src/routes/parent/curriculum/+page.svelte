<script lang="ts">
  import { Card } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();
</script>

<svelte:head>
  <title>Curriculum — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">{m.curriculum_title()}</h1>

  {#if data.subjects.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">{m.curriculum_no_subjects()}</p>
      <p class="text-sm mt-1">{m.curriculum_no_subjects_hint()}</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each data.subjects as subject (subject.id)}
        <a href="/parent/curriculum/{subject.id}">
          <Card hover>
            <h3 class="text-lg font-semibold text-text mb-2">{subject.name}</h3>
            {#if subject.description}
              <p class="text-sm text-text-muted mb-4 line-clamp-2">{subject.description}</p>
            {/if}
            <p class="text-xs text-text-muted">
              {subject.topics?.length ?? 0} topic{(subject.topics?.length ?? 0) === 1 ? '' : 's'}
            </p>
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
