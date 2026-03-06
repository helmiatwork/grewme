<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Card, Button, Input, Alert } from '$lib/components/ui';

  let { data, form } = $props();

  let editing = $state(false);
  let showTopicForm = $state(false);
  let submitting = $state(false);
  let topicSubmitting = $state(false);

  $effect(() => {
    if (form?.updateSuccess) {
      editing = false;
      invalidateAll();
    }
    if (form?.topicSuccess) {
      showTopicForm = false;
      invalidateAll();
    }
  });

  function confirmDelete() {
    if (confirm(`Delete subject "${data.subject.name}"? This cannot be undone.`)) {
      const formEl = document.getElementById('delete-subject-form') as HTMLFormElement;
      formEl?.requestSubmit();
    }
  }
</script>

<svelte:head>
  <title>{data.subject.name} — GrewMe</title>
</svelte:head>

<div>
  <!-- Breadcrumb -->
  <nav class="text-sm text-text-muted mb-4">
    <a href="/teacher/curriculum" class="hover:text-text">Curriculum</a>
    <span class="mx-2">/</span>
    <span class="text-text">{data.subject.name}</span>
  </nav>

  <!-- Subject Header -->
  {#if editing}
    <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
      <h2 class="text-lg font-semibold text-text mb-4">Edit Subject</h2>
      {#if form?.updateError}
        <div class="mb-4"><Alert variant="error">{form.updateError}</Alert></div>
      {/if}
      <form
        method="POST"
        action="?/updateSubject"
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
            <label for="edit-name" class="block text-sm font-medium text-text mb-1">Name</label>
            <Input id="edit-name" name="name" value={data.subject.name} required />
          </div>
          <div>
            <label for="edit-description" class="block text-sm font-medium text-text mb-1">Description</label>
            <Input id="edit-description" name="description" value={data.subject.description ?? ''} />
          </div>
          <div class="flex gap-2">
            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
            <Button variant="ghost" onclick={() => (editing = false)}>Cancel</Button>
          </div>
        </div>
      </form>
    </div>
  {:else}
    <div class="flex items-start justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-text">{data.subject.name}</h1>
        {#if data.subject.description}
          <p class="text-text-muted mt-1">{data.subject.description}</p>
        {/if}
      </div>
      <div class="flex gap-2">
        <Button variant="outline" onclick={() => (editing = true)}>Edit</Button>
        <Button variant="danger" onclick={confirmDelete}>Delete</Button>
      </div>
    </div>
  {/if}

  <!-- Hidden delete form -->
  <form id="delete-subject-form" method="POST" action="?/deleteSubject" class="hidden">
    <!-- empty -->
  </form>
  {#if form?.deleteError}
    <div class="mb-4"><Alert variant="error">{form.deleteError}</Alert></div>
  {/if}

  <!-- Topics Section -->
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold text-text">Topics</h2>
    <Button onclick={() => (showTopicForm = !showTopicForm)}>
      {showTopicForm ? 'Cancel' : 'Add Topic'}
    </Button>
  </div>

  {#if form?.topicError}
    <div class="mb-4"><Alert variant="error">{form.topicError}</Alert></div>
  {/if}

  {#if showTopicForm}
    <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-4">
      <h3 class="text-base font-semibold text-text mb-3">New Topic</h3>
      <form
        method="POST"
        action="?/createTopic"
        use:enhance={() => {
          topicSubmitting = true;
          return async ({ update }) => {
            topicSubmitting = false;
            await update();
          };
        }}
      >
        <div class="space-y-3">
          <div>
            <label for="topic-name" class="block text-sm font-medium text-text mb-1">Topic Name</label>
            <Input id="topic-name" name="name" placeholder="e.g. Algebra Basics" required />
          </div>
          <div>
            <label for="topic-description" class="block text-sm font-medium text-text mb-1">
              Description <span class="text-text-muted">(optional)</span>
            </label>
            <Input id="topic-description" name="description" placeholder="Brief description..." />
          </div>
          <div class="flex gap-2">
            <Button type="submit" disabled={topicSubmitting}>
              {topicSubmitting ? 'Adding...' : 'Add Topic'}
            </Button>
            <Button variant="ghost" onclick={() => (showTopicForm = false)}>Cancel</Button>
          </div>
        </div>
      </form>
    </div>
  {/if}

  {#if data.subject.topics?.length === 0}
    <div class="text-center py-10 text-text-muted">
      <p>No topics yet. Add your first topic above.</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each data.subject.topics ?? [] as topic}
        <a href="/teacher/curriculum/{data.subject.id}/{topic.id}">
          <Card hover>
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <span class="text-xs text-text-muted font-mono">#{topic.position}</span>
                  <h3 class="font-semibold text-text">{topic.name}</h3>
                </div>
                {#if topic.description}
                  <p class="text-sm text-text-muted mt-1 line-clamp-2">{topic.description}</p>
                {/if}
              </div>
              <div class="flex gap-2 ml-4 shrink-0">
                <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  {topic.learningObjectives?.length ?? 0} objectives
                </span>
                <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                  {topic.exams?.length ?? 0} exams
                </span>
              </div>
            </div>
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
