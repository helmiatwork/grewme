<script lang="ts">
  import { enhance } from '$app/forms';
  import { Card, Button, Alert } from '$lib/components/ui';

  let { data, form } = $props();
  let transferStudentId = $state('');
  let transferFromId = $state('');
  let transferToId = $state('');
</script>

<svelte:head>
  <title>Students — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">Students</h1>

  {#if form?.error}
    <div class="mb-4"><Alert variant="error">{form.error}</Alert></div>
  {/if}
  {#if form?.success}
    <div class="mb-4"><Alert variant="success">Student transferred successfully</Alert></div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
      {#each data.classrooms as classroom}
        <div class="mb-6">
          <h2 class="text-lg font-semibold text-text mb-3">{classroom.name}</h2>
          {#if classroom.students.length === 0}
            <p class="text-sm text-text-muted">No students enrolled</p>
          {:else}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {#each classroom.students as student}
                <Card>
                  {#snippet children()}
                    <p class="font-medium text-text">{student.name}</p>
                  {/snippet}
                </Card>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <div>
      <h2 class="text-lg font-semibold text-text mb-3">Transfer Student</h2>
      <Card>
        {#snippet children()}
          <form method="POST" action="?/transfer" use:enhance class="space-y-3">
            <div>
              <label for="fromClassroomId" class="block text-sm font-medium text-text mb-1">From Classroom</label>
              <select name="fromClassroomId" id="fromClassroomId" bind:value={transferFromId} class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required>
                <option value="">Select classroom...</option>
                {#each data.classrooms as c}
                  <option value={c.id}>{c.name}</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="studentId" class="block text-sm font-medium text-text mb-1">Student</label>
              <select name="studentId" id="studentId" bind:value={transferStudentId} class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required>
                <option value="">Select student...</option>
                {#each data.classrooms.find(c => c.id === transferFromId)?.students ?? [] as student}
                  <option value={student.id}>{student.name}</option>
                {/each}
              </select>
            </div>
            <div>
              <label for="toClassroomId" class="block text-sm font-medium text-text mb-1">To Classroom</label>
              <select name="toClassroomId" id="toClassroomId" bind:value={transferToId} class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" required>
                <option value="">Select classroom...</option>
                {#each data.classrooms.filter(c => c.id !== transferFromId) as c}
                  <option value={c.id}>{c.name}</option>
                {/each}
              </select>
            </div>
            <Button type="submit" class="w-full">Transfer</Button>
          </form>
        {/snippet}
      </Card>
    </div>
  </div>
</div>
