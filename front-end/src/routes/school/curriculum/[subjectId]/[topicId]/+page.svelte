<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Card, Button, Input, Alert, Badge } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data, form } = $props();

  let showEditTopic = $state(false);
  let showNewLOForm = $state(false);
  let editingLO = $state<string | null>(null);
  let submitting = $state(false);

  $effect(() => {
    if (form?.updateSuccess) {
      showEditTopic = false;
      invalidateAll();
    }
    if (form?.loSuccess) {
      showNewLOForm = false;
      invalidateAll();
    }
    if (form?.loUpdateSuccess) {
      editingLO = null;
      invalidateAll();
    }
    if (form?.loDeleteSuccess) {
      invalidateAll();
    }
  });

  const examTypeBadge: Record<string, string> = {
    SCORE_BASED: 'bg-blue-100 text-blue-700',
    MULTIPLE_CHOICE: 'bg-green-100 text-green-700',
    RUBRIC: 'bg-purple-100 text-purple-700',
    PASS_FAIL: 'bg-amber-100 text-amber-700'
  };

  const examTypeLabels: Record<string, string> = {
    SCORE_BASED: 'Score Based',
    MULTIPLE_CHOICE: 'Multiple Choice',
    RUBRIC: 'Rubric',
    PASS_FAIL: 'Pass/Fail'
  };

  function examTypeLabel(type: string) {
    return examTypeLabels[type] ?? type;
  }
</script>

<svelte:head>
  <title>{data.topic?.name ?? 'Topic'} — GrewMe</title>
</svelte:head>

<div>
  <!-- Breadcrumb -->
  <nav class="text-sm text-text-muted mb-4">
    <a href="/school/curriculum" class="hover:text-text">{m.curriculum_title()}</a>
    <span class="mx-2">›</span>
    <a href="/school/curriculum/{data.topic?.subject?.id}" class="hover:text-text">
      {data.topic?.subject?.name}
    </a>
    <span class="mx-2">›</span>
    <span class="text-text">{data.topic?.name}</span>
  </nav>

  {#if form?.updateError || form?.deleteError || form?.loError || form?.loUpdateError || form?.loDeleteError}
    <div class="mb-4">
      <Alert variant="error">
        {form?.updateError ?? form?.deleteError ?? form?.loError ?? form?.loUpdateError ?? form?.loDeleteError}
      </Alert>
    </div>
  {/if}

  <!-- Topic Header -->
  <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
    {#if showEditTopic}
      <form
        method="POST"
        action="?/updateTopic"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            submitting = false;
            await update();
          };
        }}
      >
        <div class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-text mb-1">{m.curriculum_topic_name()}</label>
            <Input id="name" name="name" value={data.topic?.name} required />
          </div>
          <div>
            <label for="description" class="block text-sm font-medium text-text mb-1">{m.curriculum_description()}</label>
            <Input id="description" name="description" value={data.topic?.description ?? ''} />
          </div>
          <div class="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? m.curriculum_saving() : m.common_save()}
            </Button>
            <Button variant="ghost" onclick={() => (showEditTopic = false)}>{m.common_cancel()}</Button>
          </div>
        </div>
      </form>
    {:else}
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-text">{data.topic?.name}</h1>
          {#if data.topic?.description}
            <p class="text-text-muted mt-1">{data.topic?.description}</p>
          {/if}
        </div>
        <div class="flex gap-2">
          <Button variant="ghost" onclick={() => (showEditTopic = true)}>{m.common_edit()}</Button>
          <form method="POST" action="?/deleteTopic" use:enhance>
            <Button type="submit" variant="ghost" class="text-red-600 hover:text-red-700">
              {m.common_delete()}
            </Button>
          </form>
        </div>
      </div>
    {/if}
  </div>

  <!-- Learning Objectives -->
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold text-text">Learning Objectives</h2>
    <Button onclick={() => (showNewLOForm = !showNewLOForm)}>
      {showNewLOForm ? m.common_cancel() : m.curriculum_add_objective()}
    </Button>
  </div>

  {#if showNewLOForm}
    <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-4">
      <h3 class="text-lg font-semibold text-text mb-4">{m.curriculum_new_objective()}</h3>
      <form
        method="POST"
        action="?/createLO"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            submitting = false;
            await update();
          };
        }}
      >
        <div class="space-y-4">
          <div>
            <label for="loDesc" class="block text-sm font-medium text-text mb-1">{m.curriculum_objective_desc()}</label>
            <Input id="loDesc" name="description" placeholder={m.curriculum_objective_desc_placeholder()} required />
          </div>
          <div>
            <label for="masteryThreshold" class="block text-sm font-medium text-text mb-1">
              Mastery Threshold <span class="text-text-muted">(0–1, default 0.8)</span>
            </label>
            <Input id="masteryThreshold" name="masteryThreshold" type="number" min="0" max="1" step="0.05" value="0.8" />
          </div>
          <div class="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? m.curriculum_adding() : m.curriculum_add_objective()}
            </Button>
            <Button variant="ghost" onclick={() => (showNewLOForm = false)}>{m.common_cancel()}</Button>
          </div>
        </div>
      </form>
    </div>
  {/if}

  {#if !data.topic?.learningObjectives || data.topic.learningObjectives.length === 0}
    <div class="text-center py-8 text-text-muted mb-6">
      <p>{m.curriculum_no_objectives()}</p>
    </div>
  {:else}
    <div class="space-y-3 mb-8">
      {#each data.topic.learningObjectives as lo (lo.id)}
        <div class="bg-surface rounded-xl border border-slate-100 p-4">
          {#if editingLO === lo.id}
            <form
              method="POST"
              action="?/updateLO"
              use:enhance={() => {
                submitting = true;
                return async ({ update }) => {
                  submitting = false;
                  await update();
                };
              }}
            >
              <input type="hidden" name="id" value={lo.id} />
              <div class="space-y-3">
                <Input name="description" value={lo.description} required />
                <Input name="masteryThreshold" type="number" min="0" max="1" step="0.05" value={lo.masteryThreshold} />
                <div class="flex gap-2">
                  <Button type="submit" disabled={submitting} class="text-sm">{m.common_save()}</Button>
                  <Button variant="ghost" onclick={() => (editingLO = null)} class="text-sm">{m.common_cancel()}</Button>
                </div>
              </div>
            </form>
          {:else}
            <div class="flex items-start justify-between">
              <div>
                <p class="text-text">{lo.description}</p>
                <p class="text-xs text-text-muted mt-1">Mastery: {Math.round(lo.masteryThreshold * 100)}%</p>
              </div>
              <div class="flex gap-2 ml-4">
                  <button
                    type="button"
                    onclick={() => (editingLO = lo.id)}
                    class="text-sm text-text-muted hover:text-text"
                  >
                    {m.common_edit()}
                  </button>
                  <form method="POST" action="?/deleteLO" use:enhance>
                    <input type="hidden" name="id" value={lo.id} />
                    <button type="submit" class="text-sm text-red-500 hover:text-red-700">{m.exam_remove()}</button>
                  </form>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}

  <!-- Exams Section -->
  <h2 class="text-xl font-semibold text-text mb-4">{m.curriculum_exams_section()}</h2>

  {#if !data.topic?.exams || data.topic.exams.length === 0}
    <div class="text-center py-8 text-text-muted">
      <p>{m.curriculum_no_topic_exams()}</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each data.topic.exams as exam}
        <a href="/school/exams/{exam.id}">
          <div class="bg-surface rounded-xl border border-slate-100 p-4 hover:border-primary/30 transition-colors">
            <div class="flex items-center justify-between">
              <h3 class="text-base font-semibold text-text">{exam.title}</h3>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium {examTypeBadge[exam.examType] ?? 'bg-slate-100 text-slate-700'}">
                {examTypeLabel(exam.examType)}
              </span>
            </div>
            {#if exam.description}
              <p class="text-sm text-text-muted mt-1">{exam.description}</p>
            {/if}
            <div class="flex gap-4 mt-2 text-xs text-text-muted">
              {#if exam.maxScore}
                <span>Max score: {exam.maxScore}</span>
              {/if}
              {#if exam.durationMinutes}
                <span>{exam.durationMinutes} min</span>
              {/if}
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
