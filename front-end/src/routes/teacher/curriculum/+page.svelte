<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Card, Button, Input, Alert } from '$lib/components/ui';

  let { data, form } = $props();

  let showNewSubjectForm = $state(false);
  let submitting = $state(false);

  function countLOs(topics: Array<{ learningObjectives?: unknown[] }>): number {
    return topics.reduce((sum, t) => sum + (t.learningObjectives?.length ?? 0), 0);
  }

  function countExams(topics: Array<{ exams?: unknown[] }>): number {
    return topics.reduce((sum, t) => sum + (t.exams?.length ?? 0), 0);
  }

  $effect(() => {
    if (form?.success) {
      showNewSubjectForm = false;
      invalidateAll();
    }
  });
</script>

<svelte:head>
  <title>Curriculum — GrewMe</title>
</svelte:head>

<div>
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-text">Curriculum</h1>
    <Button onclick={() => (showNewSubjectForm = !showNewSubjectForm)}>
      {showNewSubjectForm ? 'Cancel' : 'New Subject'}
    </Button>
  </div>

  {#if form?.error}
    <div class="mb-4">
      <Alert variant="error">{form.error}</Alert>
    </div>
  {/if}

  {#if showNewSubjectForm}
    <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
      <h2 class="text-lg font-semibold text-text mb-4">New Subject</h2>
      <form
        method="POST"
        action="?/createSubject"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            submitting = false;
            await update();
          };
        }}
      >
        <input type="hidden" name="schoolId" value={data.schoolId ?? ''} />
        <div class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-text mb-1">Subject Name</label>
            <Input id="name" name="name" placeholder="e.g. Mathematics" required />
          </div>
          <div>
            <label for="description" class="block text-sm font-medium text-text mb-1"
              >Description <span class="text-text-muted">(optional)</span></label
            >
            <Input id="description" name="description" placeholder="Brief description..." />
          </div>
          <div class="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Subject'}
            </Button>
            <Button variant="ghost" onclick={() => (showNewSubjectForm = false)}>Cancel</Button>
          </div>
        </div>
      </form>
    </div>
  {/if}

  {#if !data.schoolId}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">No school found</p>
      <p class="text-sm mt-1">You need to be assigned to a classroom with a school first.</p>
    </div>
  {:else if data.subjects.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">No subjects yet</p>
      <p class="text-sm mt-1">Create your first subject to get started.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each data.subjects as subject}
        {@const topicCount = subject.topics?.length ?? 0}
        {@const loCount = countLOs(subject.topics ?? [])}
        {@const examCount = countExams(subject.topics ?? [])}
        <a href="/teacher/curriculum/{subject.id}">
          <Card hover>
            <h3 class="text-lg font-semibold text-text">{subject.name}</h3>
            {#if subject.description}
              <p class="text-sm text-text-muted mt-1 line-clamp-2">{subject.description}</p>
            {/if}
            <div class="flex flex-wrap gap-2 mt-3">
              <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {topicCount} topic{topicCount !== 1 ? 's' : ''}
              </span>
              <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {loCount} objective{loCount !== 1 ? 's' : ''}
              </span>
              <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {examCount} exam{examCount !== 1 ? 's' : ''}
              </span>
            </div>
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
