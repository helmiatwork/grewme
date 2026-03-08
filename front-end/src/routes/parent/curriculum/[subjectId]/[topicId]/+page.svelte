<script lang="ts">
  import { Card, Badge } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.topic.name} — GrewMe</title>
</svelte:head>

<div>
  <div class="mb-6">
    <nav class="text-sm text-text-muted mb-2">
      <a href="/parent/curriculum" class="hover:text-primary transition-colors">{m.curriculum_title()}</a>
      <span class="mx-2">›</span>
      <a href="/parent/curriculum/{data.topic.subject.id}" class="hover:text-primary transition-colors">
        {data.topic.subject.name}
      </a>
      <span class="mx-2">›</span>
      <span class="text-text">{data.topic.name}</span>
    </nav>
    <h1 class="text-2xl font-bold text-text">{data.topic.name}</h1>
    {#if data.topic.description}
      <p class="text-text-muted mt-1">{data.topic.description}</p>
    {/if}
  </div>

  <!-- Learning Objectives -->
  <div class="mb-8">
    <h2 class="text-lg font-semibold text-text mb-4">{m.curriculum_learning_objectives()}</h2>
    {#if data.topic.learningObjectives.length === 0}
      <p class="text-text-muted text-sm">{m.curriculum_no_objectives()}</p>
    {:else}
      <div class="space-y-3">
        {#each data.topic.learningObjectives as lo (lo.id)}
          <Card>
            <p class="text-sm text-text">{lo.description}</p>
            <p class="text-xs text-text-muted mt-2">
              {m.curriculum_mastery_label({ threshold: lo.masteryThreshold })}
            </p>
          </Card>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Exams -->
  <div>
    <h2 class="text-lg font-semibold text-text mb-4">{m.curriculum_exams_section()}</h2>
    {#if data.topic.exams.length === 0}
      <p class="text-text-muted text-sm">{m.curriculum_no_topic_exams()}</p>
    {:else}
      <div class="space-y-3">
        {#each data.topic.exams as exam (exam.id)}
          <Card>
            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="text-sm font-semibold text-text">{exam.title}</h3>
                {#if exam.description}
                  <p class="text-xs text-text-muted mt-0.5">{exam.description}</p>
                {/if}
              </div>
              <div class="flex items-center gap-3 shrink-0">
                <Badge>{exam.examType.replace('_', ' ')}</Badge>
                {#if exam.maxScore}
                  <span class="text-xs text-text-muted">{exam.maxScore} pts</span>
                {/if}
              </div>
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  </div>
</div>
