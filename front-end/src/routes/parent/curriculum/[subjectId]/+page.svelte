<script lang="ts">
  import { Card } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.subject.name} — GrewMe</title>
</svelte:head>

<div>
  <div class="mb-6">
    <nav class="text-sm text-text-muted mb-2">
      <a href="/parent/curriculum" class="hover:text-primary transition-colors">{m.curriculum_title()}</a>
      <span class="mx-2">›</span>
      <span class="text-text">{data.subject.name}</span>
    </nav>
    <h1 class="text-2xl font-bold text-text">{data.subject.name}</h1>
    {#if data.subject.description}
      <p class="text-text-muted mt-1">{data.subject.description}</p>
    {/if}
  </div>

  {#if data.subject.topics.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">{m.curriculum_no_topics()}</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each data.subject.topics as topic (topic.id)}
        <a href="/parent/curriculum/{data.subject.id}/{topic.id}">
          <Card hover>
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <h3 class="text-base font-semibold text-text">{topic.name}</h3>
                {#if topic.description}
                  <p class="text-sm text-text-muted mt-1 line-clamp-2">{topic.description}</p>
                {/if}
              </div>
              <div class="flex gap-4 text-xs text-text-muted shrink-0">
                <span>{topic.learningObjectives?.length ?? 0} LO{(topic.learningObjectives?.length ?? 0) === 1 ? '' : 's'}</span>
              </div>
            </div>
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
