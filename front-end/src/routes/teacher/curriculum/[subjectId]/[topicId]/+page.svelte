<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Card, Button, Input, Alert } from '$lib/components/ui';

  let { data, form } = $props();

  let editingTopic = $state(false);
  let showLOForm = $state(false);
  let editingLOId = $state<string | null>(null);
  let submitting = $state(false);
  let loSubmitting = $state(false);

  $effect(() => {
    if (form?.updateSuccess) {
      editingTopic = false;
      invalidateAll();
    }
    if (form?.loSuccess) {
      showLOForm = false;
      invalidateAll();
    }
    if (form?.loEditSuccess) {
      editingLOId = null;
      invalidateAll();
    }
    if (form?.loDeleteSuccess) {
      invalidateAll();
    }
  });

  function confirmDeleteTopic() {
    if (confirm(`Delete topic "${data.topic.name}"? This cannot be undone.`)) {
      const formEl = document.getElementById('delete-topic-form') as HTMLFormElement;
      formEl?.requestSubmit();
    }
  }

  function confirmDeleteLO(id: string, desc: string) {
    if (confirm(`Delete objective "${desc}"? This cannot be undone.`)) {
      const formEl = document.getElementById(`delete-lo-form-${id}`) as HTMLFormElement;
      formEl?.requestSubmit();
    }
  }

  const examTypeLabels: Record<string, string> = {
    SCORE_BASED: 'Score',
    MULTIPLE_CHOICE: 'MCQ',
    RUBRIC: 'Rubric',
    PASS_FAIL: 'Pass/Fail'
  };
</script>

<svelte:head>
  <title>{data.topic.name} — GrewMe</title>
</svelte:head>

<div>
  <!-- Breadcrumb -->
  <nav class="text-sm text-text-muted mb-4">
    <a href="/teacher/curriculum" class="hover:text-text">Curriculum</a>
    <span class="mx-2">/</span>
    <a href="/teacher/curriculum/{data.topic.subject?.id}" class="hover:text-text">
      {data.topic.subject?.name}
    </a>
    <span class="mx-2">/</span>
    <span class="text-text">{data.topic.name}</span>
  </nav>

  <!-- Topic Header -->
  {#if editingTopic}
    <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
      <h2 class="text-lg font-semibold text-text mb-4">Edit Topic</h2>
      {#if form?.updateError}
        <div class="mb-4"><Alert variant="error">{form.updateError}</Alert></div>
      {/if}
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
            <label for="topic-name" class="block text-sm font-medium text-text mb-1">Name</label>
            <Input id="topic-name" name="name" value={data.topic.name} required />
          </div>
          <div>
            <label for="topic-desc" class="block text-sm font-medium text-text mb-1">Description</label>
            <Input id="topic-desc" name="description" value={data.topic.description ?? ''} />
          </div>
          <div class="flex gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
            <Button variant="ghost" onclick={() => (editingTopic = false)}>Cancel</Button>
          </div>
        </div>
      </form>
    </div>
  {:else}
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-text">{data.topic.name}</h1>
        {#if data.topic.description}
          <p class="text-text-muted mt-1">{data.topic.description}</p>
        {/if}
      </div>
      <div class="flex gap-2">
        <Button variant="outline" onclick={() => (editingTopic = true)}>Edit</Button>
        <Button variant="danger" onclick={confirmDeleteTopic}>Delete</Button>
      </div>
    </div>
  {/if}

  <!-- Hidden delete topic form -->
  <form id="delete-topic-form" method="POST" action="?/deleteTopic" class="hidden"></form>
  {#if form?.deleteError}
    <div class="mb-4"><Alert variant="error">{form.deleteError}</Alert></div>
  {/if}

  <!-- Learning Objectives Section -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold text-text">Learning Objectives</h2>
      <Button onclick={() => (showLOForm = !showLOForm)}>
        {showLOForm ? 'Cancel' : 'Add Objective'}
      </Button>
    </div>

    {#if form?.loError}
      <div class="mb-4"><Alert variant="error">{form.loError}</Alert></div>
    {/if}

    {#if showLOForm}
      <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-4">
        <h3 class="text-base font-semibold text-text mb-3">New Learning Objective</h3>
        <form
          method="POST"
          action="?/createLearningObjective"
          use:enhance={() => {
            loSubmitting = true;
            return async ({ update }) => {
              loSubmitting = false;
              await update();
            };
          }}
        >
          <div class="space-y-3">
            <div>
              <label for="lo-desc" class="block text-sm font-medium text-text mb-1">Description</label>
              <Input id="lo-desc" name="description" placeholder="Students will be able to..." required />
            </div>
            <div>
              <label for="lo-threshold" class="block text-sm font-medium text-text mb-1">
                Mastery Threshold (0–100)
              </label>
              <Input id="lo-threshold" name="masteryThreshold" type="number" min="0" max="100" value="70" required />
            </div>
            <div class="flex gap-2">
              <Button type="submit" disabled={loSubmitting}>
                {loSubmitting ? 'Adding...' : 'Add Objective'}
              </Button>
              <Button variant="ghost" onclick={() => (showLOForm = false)}>Cancel</Button>
            </div>
          </div>
        </form>
      </div>
    {/if}

    {#if (data.topic.learningObjectives ?? []).length === 0}
      <p class="text-text-muted text-sm py-4">No learning objectives yet.</p>
    {:else}
      <div class="space-y-2">
        {#each data.topic.learningObjectives ?? [] as lo}
          {#if editingLOId === lo.id}
            <div class="bg-surface rounded-xl border border-slate-100 p-4">
              {#if form?.loEditError}
                <div class="mb-3"><Alert variant="error">{form.loEditError}</Alert></div>
              {/if}
              <form
                method="POST"
                action="?/updateLearningObjective"
                use:enhance={() => {
                  return async ({ update }) => {
                    await update();
                  };
                }}
              >
                <input type="hidden" name="id" value={lo.id} />
                <div class="space-y-2">
                  <Input name="description" value={lo.description} required />
                  <Input name="masteryThreshold" type="number" min="0" max="100" value={lo.masteryThreshold} required />
                  <div class="flex gap-2">
                    <Button type="submit" size="sm">Save</Button>
                    <Button variant="ghost" size="sm" onclick={() => (editingLOId = null)}>Cancel</Button>
                  </div>
                </div>
              </form>
            </div>
          {:else}
            <div class="bg-surface rounded-xl border border-slate-100 p-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="text-xs text-text-muted font-mono">#{lo.position}</span>
                <div>
                  <p class="text-sm text-text">{lo.description}</p>
                  <p class="text-xs text-text-muted mt-0.5">Mastery: {lo.masteryThreshold}%</p>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  class="text-xs text-primary hover:underline"
                  onclick={() => (editingLOId = lo.id)}
                >Edit</button>
                <button
                  class="text-xs text-red-500 hover:underline"
                  onclick={() => confirmDeleteLO(lo.id, lo.description)}
                >Delete</button>
                <form
                  id="delete-lo-form-{lo.id}"
                  method="POST"
                  action="?/deleteLearningObjective"
                  class="hidden"
                  use:enhance={() => {
                    return async ({ update }) => {
                      await update();
                    };
                  }}
                >
                  <input type="hidden" name="id" value={lo.id} />
                </form>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  </div>

  <!-- Exams Section -->
  <div>
    <h2 class="text-xl font-semibold text-text mb-4">Exams</h2>

    {#if (data.topic.exams ?? []).length === 0}
      <p class="text-text-muted text-sm py-4">No exams linked to this topic yet.</p>
    {:else}
      <div class="space-y-2">
        {#each data.topic.exams ?? [] as exam}
          <a href="/teacher/exams/{exam.id}">
            <Card hover>
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-text">{exam.title}</h3>
                  {#if exam.description}
                    <p class="text-sm text-text-muted mt-0.5 line-clamp-1">{exam.description}</p>
                  {/if}
                </div>
                <div class="flex gap-2 items-center ml-4 shrink-0">
                  <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    {examTypeLabels[exam.examType] ?? exam.examType}
                  </span>
                  {#if exam.maxScore != null}
                    <span class="text-xs text-text-muted">{exam.maxScore} pts</span>
                  {/if}
                </div>
              </div>
            </Card>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>
