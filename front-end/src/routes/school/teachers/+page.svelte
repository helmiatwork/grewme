<script lang="ts">
  import { enhance } from '$app/forms';
  import { Card, Button, Alert } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data, form } = $props();
  let assignTeacherId = $state('');
  let assignClassroomId = $state('');
  let assignRole = $state('assistant');
</script>

<svelte:head>
  <title>Teachers — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">{m.school_teachers_title()}</h1>

  {#if form?.error}
    <div class="mb-4"><Alert variant="error">{form.error}</Alert></div>
  {/if}
  {#if form?.success}
    <div class="mb-4"><Alert variant="success">{m.school_teachers_action_success()}</Alert></div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      <h2 class="text-lg font-semibold text-text mb-3">{m.school_teachers_all()}</h2>
      <div class="space-y-3">
        {#each data.teachers as teacher}
          <Card>
            {#snippet children()}
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="font-semibold text-text">{teacher.name}</h3>
                  <p class="text-sm text-text-muted">{teacher.email}</p>
                  {#if teacher.classrooms.length > 0}
                    <div class="flex flex-wrap gap-1 mt-2">
                      {#each teacher.classrooms as cls}
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {cls.name}
                          <form method="POST" action="?/remove" use:enhance class="inline">
                            <input type="hidden" name="teacherId" value={teacher.id} />
                            <input type="hidden" name="classroomId" value={cls.id} />
                            <button type="submit" class="ml-1 text-red-400 hover:text-red-600" title="Remove from {cls.name}">&times;</button>
                          </form>
                        </span>
                      {/each}
                    </div>
                  {:else}
                    <p class="text-xs text-text-muted mt-1">{m.school_teachers_no_classrooms()}</p>
                  {/if}
                </div>
              </div>
            {/snippet}
          </Card>
        {/each}
      </div>
    </div>

    <div>
      <h2 class="text-lg font-semibold text-text mb-3">{m.school_teachers_assign()}</h2>
      <Card>
        {#snippet children()}
          <form method="POST" action="?/assign" use:enhance class="space-y-3">
            <div>
              <label for="teacherId" class="block text-sm font-medium text-text mb-1">Teacher</label>
              <select name="teacherId" id="teacherId" bind:value={assignTeacherId} class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required>
                <option value="">Select teacher...</option>
                {#each data.teachers as t}
                  <option value={t.id}>{t.name}</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="classroomId" class="block text-sm font-medium text-text mb-1">Classroom</label>
              <select name="classroomId" id="classroomId" bind:value={assignClassroomId} class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required>
                <option value="">Select classroom...</option>
                {#each data.classrooms as c}
                  <option value={c.id}>{c.name}</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="role" class="block text-sm font-medium text-text mb-1">{m.school_teachers_role()}</label>
              <select name="role" id="role" bind:value={assignRole} class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="primary">{m.school_teachers_role_primary()}</option>
                <option value="assistant">{m.school_teachers_role_assistant()}</option>
                <option value="substitute">{m.school_teachers_role_substitute()}</option>
              </select>
            </div>
            <Button type="submit" class="w-full">{m.school_teachers_assign_btn()}</Button>
          </form>
        {/snippet}
      </Card>
    </div>
  </div>
</div>
