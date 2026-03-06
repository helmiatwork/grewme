<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Card, Button, Input, Alert } from '$lib/components/ui';

  let { data, form } = $props();

  let showCreateForm = $state(false);
  let editingId = $state<string | null>(null);
  let submitting = $state(false);

  $effect(() => {
    if (form?.success) {
      showCreateForm = false;
      editingId = null;
      invalidateAll();
    }
  });

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
</script>

<svelte:head>
  <title>Academic Years — GrewMe</title>
</svelte:head>

<div>
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-text">Academic Years</h1>
      <p class="text-sm text-text-muted mt-1">Manage academic years for your school.</p>
    </div>
    <Button onclick={() => { showCreateForm = !showCreateForm; editingId = null; }}>
      {showCreateForm ? 'Cancel' : 'New Academic Year'}
    </Button>
  </div>

  {#if form?.error}
    <div class="mb-4"><Alert variant="error">{form.error}</Alert></div>
  {/if}

  {#if form?.success}
    <div class="mb-4"><Alert variant="success">Saved successfully!</Alert></div>
  {/if}

  {#if showCreateForm}
    <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
      <h2 class="text-lg font-semibold text-text mb-4">New Academic Year</h2>
      <form
        method="POST"
        action="?/create"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => { submitting = false; await update(); };
        }}
      >
        <input type="hidden" name="schoolId" value={data.schoolId ?? ''} />
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label for="label" class="block text-sm font-medium text-text mb-1">Label</label>
            <Input id="label" name="label" placeholder="e.g. 2025/2026" required />
          </div>
          <div>
            <label for="startDate" class="block text-sm font-medium text-text mb-1">Start Date</label>
            <input type="date" id="startDate" name="startDate" required class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div>
            <label for="endDate" class="block text-sm font-medium text-text mb-1">End Date</label>
            <input type="date" id="endDate" name="endDate" required class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
          </div>
          <div class="md:col-span-2">
            <label class="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" name="current" value="true" class="rounded border-slate-300" />
              Set as current academic year
            </label>
          </div>
        </div>
        <div class="flex gap-2 mt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Academic Year'}
          </Button>
          <Button variant="ghost" onclick={() => (showCreateForm = false)}>Cancel</Button>
        </div>
      </form>
    </div>
  {/if}

  {#if !data.schoolId}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">No school found</p>
    </div>
  {:else if data.academicYears.length === 0 && !showCreateForm}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">No academic years yet</p>
      <p class="text-sm mt-1">Create the first academic year to get started.</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each data.academicYears as year}
        <div class="bg-surface rounded-xl border border-slate-100 p-4">
          {#if editingId === year.id}
            <!-- Edit form -->
            <form
              method="POST"
              action="?/update"
              use:enhance={() => {
                submitting = true;
                return async ({ update }) => { submitting = false; await update(); };
              }}
            >
              <input type="hidden" name="id" value={year.id} />
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label for="edit-label" class="block text-xs font-medium text-text-muted mb-1">Label</label>
                  <Input id="edit-label" name="label" value={year.label} />
                </div>
                <div>
                  <label for="edit-start" class="block text-xs font-medium text-text-muted mb-1">Start Date</label>
                  <input type="date" id="edit-start" name="startDate" value={year.startDate} class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label for="edit-end" class="block text-xs font-medium text-text-muted mb-1">End Date</label>
                  <input type="date" id="edit-end" name="endDate" value={year.endDate} class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div class="flex gap-2 mt-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save'}
                </Button>
                <Button variant="ghost" onclick={() => (editingId = null)}>Cancel</Button>
              </div>
            </form>
          {:else}
            <!-- Display -->
            <div class="flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-semibold text-text">{year.label}</h3>
                  {#if year.current}
                    <span class="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">Current</span>
                  {/if}
                </div>
                <p class="text-sm text-text-muted mt-0.5">
                  {formatDate(year.startDate)} — {formatDate(year.endDate)}
                </p>
              </div>
              <div class="flex items-center gap-2">
                {#if !year.current}
                  <form method="POST" action="?/setCurrent" use:enhance={() => { submitting = true; return async ({ update }) => { submitting = false; await update(); }; }}>
                    <input type="hidden" name="id" value={year.id} />
                    <Button variant="ghost" type="submit" disabled={submitting}>Set Current</Button>
                  </form>
                {/if}
                <Button variant="ghost" onclick={() => { editingId = year.id; showCreateForm = false; }}>Edit</Button>
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
