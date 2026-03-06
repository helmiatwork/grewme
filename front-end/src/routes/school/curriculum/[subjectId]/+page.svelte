<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Card, Button, Input, Alert } from '$lib/components/ui';

  let { data, form } = $props();

  let showEditSubject = $state(false);
  let showNewTopicForm = $state(false);
  let submitting = $state(false);

  $effect(() => {
    if (form?.updateSuccess) {
      showEditSubject = false;
      invalidateAll();
    }
    if (form?.topicSuccess) {
      showNewTopicForm = false;
      invalidateAll();
    }
    if (form?.deleteSuccess) {
      invalidateAll();
    }
  });
</script>

<svelte:head>
  <title>{data.subject?.name ?? 'Subject'} — GrewMe</title>
</svelte:head>

<div>
  <!-- Breadcrumb -->
  <nav class="text-sm text-text-muted mb-4">
    <a href="/school/curriculum" class="hover:text-text">Curriculum</a>
    <span class="mx-2">›</span>
    <span class="text-text">{data.subject?.name}</span>
  </nav>

  {#if form?.updateError || form?.deleteError || form?.topicError}
    <div class="mb-4">
      <Alert variant="error">{form?.updateError ?? form?.deleteError ?? form?.topicError}</Alert>
    </div>
  {/if}

  <!-- Subject Header -->
  <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
    {#if showEditSubject}
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
            <label for="name" class="block text-sm font-medium text-text mb-1">Subject Name</label>
            <Input id="name" name="name" value={data.subject?.name} required />
          </div>
          <div>
            <label for="description" class="block text-sm font-medium text-text mb-1">Description</label>
            <Input id="description" name="description" value={data.subject?.description ?? ''} />
          </div>
          <div class="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="ghost" onclick={() => (showEditSubject = false)}>Cancel</Button>
          </div>
        </div>
      </form>
    {:else}
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold text-text">{data.subject?.name}</h1>
          {#if data.subject?.description}
            <p class="text-text-muted mt-1">{data.subject?.description}</p>
          {/if}
        </div>
        <div class="flex gap-2">
          <Button variant="ghost" onclick={() => (showEditSubject = true)}>Edit</Button>
          <form method="POST" action="?/deleteSubject" use:enhance>
            <Button type="submit" variant="ghost" class="text-red-600 hover:text-red-700">
              Delete
            </Button>
          </form>
        </div>
      </div>
    {/if}
  </div>

  <!-- Topics Section -->
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-xl font-semibold text-text">Topics</h2>
    <Button onclick={() => (showNewTopicForm = !showNewTopicForm)}>
      {showNewTopicForm ? 'Cancel' : 'Add Topic'}
    </Button>
  </div>

  {#if showNewTopicForm}
    <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-4">
      <h3 class="text-lg font-semibold text-text mb-4">New Topic</h3>
      <form
        method="POST"
        action="?/createTopic"
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
            <label for="topicName" class="block text-sm font-medium text-text mb-1">Topic Name</label>
            <Input id="topicName" name="name" placeholder="e.g. Algebra" required />
          </div>
          <div>
            <label for="topicDescription" class="block text-sm font-medium text-text mb-1">
              Description <span class="text-text-muted">(optional)</span>
            </label>
            <Input id="topicDescription" name="description" placeholder="Brief description..." />
          </div>
          <div class="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Topic'}
            </Button>
            <Button variant="ghost" onclick={() => (showNewTopicForm = false)}>Cancel</Button>
          </div>
        </div>
      </form>
    </div>
  {/if}

  {#if !data.subject?.topics || data.subject.topics.length === 0}
    <div class="text-center py-10 text-text-muted">
      <p class="text-lg">No topics yet</p>
      <p class="text-sm mt-1">Add your first topic to this subject.</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each data.subject.topics as topic}
        <div class="bg-surface rounded-xl border border-slate-100 p-5 flex items-center justify-between">
          <a href="/school/curriculum/{data.subject.id}/{topic.id}" class="flex-1 hover:opacity-80">
            <h3 class="text-base font-semibold text-text">{topic.name}</h3>
            {#if topic.description}
              <p class="text-sm text-text-muted mt-0.5">{topic.description}</p>
            {/if}
            <div class="flex gap-3 mt-2 text-xs text-text-muted">
              <span>{topic.learningObjectives?.length ?? 0} objectives</span>
              <span>{topic.exams?.length ?? 0} exams</span>
            </div>
          </a>
          <form method="POST" action="?/deleteTopic" use:enhance>
            <input type="hidden" name="topicId" value={topic.id} />
            <Button type="submit" variant="ghost" class="text-red-500 hover:text-red-700 text-sm ml-4">
              Remove
            </Button>
          </form>
        </div>
      {/each}
    </div>
  {/if}
</div>
