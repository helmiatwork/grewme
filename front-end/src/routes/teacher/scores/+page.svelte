<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { Button, Input, Card, Alert } from '$lib/components/ui';
  import { SKILL_CATEGORIES, SKILL_LABELS, SKILL_EMOJIS, SKILL_BG_COLORS } from '$lib/utils/constants';
  import { today } from '$lib/utils/helpers';
  import type { SkillCategory } from '$lib/api/types';

  let { data, form } = $props();
  let loading = $state(false);
  let selectedSkill = $state<SkillCategory | ''>('');

  function onClassroomChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    goto(`/teacher/scores?classroom=${target.value}`, { replaceState: true });
  }
</script>

<svelte:head>
  <title>Add Score — GrewMe</title>
</svelte:head>

<div class="max-w-lg mx-auto">
  <h1 class="text-2xl font-bold text-text mb-6">Add Daily Score</h1>

  {#if form?.success}
    <div class="mb-4">
      <Alert variant="success">Score added successfully!</Alert>
    </div>
  {/if}

  {#if form?.error}
    <div class="mb-4">
      <Alert variant="error">{form.error}</Alert>
    </div>
  {/if}

  <Card>
    <form
      method="POST"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          loading = false;
          await update();
        };
      }}
      class="space-y-5"
    >
      <!-- Classroom selector -->
      <div class="space-y-1">
        <label class="block text-sm font-medium text-text" for="classroom">Classroom</label>
        <select
          id="classroom"
          onchange={onClassroomChange}
          value={data.selectedClassroom ?? ''}
          class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">Select classroom...</option>
          {#each data.classrooms as classroom}
            <option value={classroom.id}>{classroom.name}</option>
          {/each}
        </select>
      </div>

      <!-- Student selector -->
      {#if data.students.length > 0}
        <div class="space-y-1">
          <label class="block text-sm font-medium text-text" for="studentId">Student</label>
          <select
            id="studentId"
            name="studentId"
            value={data.selectedStudent ?? ''}
            class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
            required
          >
            <option value="">Select student...</option>
            {#each data.students as student}
              <option value={student.id}>{student.name}</option>
            {/each}
          </select>
        </div>
      {/if}

      <!-- Date -->
      <Input label="Date" type="date" name="date" id="date" value={today()} required />

      <!-- Skill Category -->
      <div class="space-y-1">
        <label class="block text-sm font-medium text-text">Skill Category</label>
        <div class="flex flex-wrap gap-2">
          {#each SKILL_CATEGORIES as skill}
            <label>
              <input
                type="radio"
                name="skillCategory"
                value={skill}
                bind:group={selectedSkill}
                class="peer sr-only"
                required
              />
              <div class="px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer border-2 border-transparent
                peer-checked:{SKILL_BG_COLORS[skill]} peer-checked:border-current
                bg-slate-100 text-slate-600 transition-colors">
                {SKILL_EMOJIS[skill]} {SKILL_LABELS[skill]}
              </div>
            </label>
          {/each}
        </div>
      </div>

      <!-- Score -->
      <div class="space-y-1">
        <label class="block text-sm font-medium text-text" for="score">Score (0-100)</label>
        <input
          type="range"
          name="score"
          id="score"
          min="0"
          max="100"
          value="50"
          class="w-full accent-primary"
        />
        <div class="flex justify-between text-xs text-text-muted">
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      <Button type="submit" {loading} class="w-full">
        Save Score
      </Button>
    </form>
  </Card>
</div>
