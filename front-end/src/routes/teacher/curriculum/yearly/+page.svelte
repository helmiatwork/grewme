<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { browser } from '$app/environment';
  import { Button, Alert } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';
  import { gradeDisplayName, gradeOptions } from '$lib/utils/grade';

  let { data, form } = $props();

  let selectedYearId = $state(data.selectedYearId ?? '');
  let selectedGrade = $state(data.selectedGrade ?? 1);
  let saving = $state(false);
  let saveSuccess = $state(false);

  // Set of selected subject IDs for the current grade
  let selectedSubjectIds = $state<Set<string>>(new Set());

  // Sync from server data — extract subject IDs from curriculum items
  $effect(() => {
    const gcItems = data.gradeCurriculum?.gradeCurriculumItems ?? [];
    const ids = new Set<string>();
    for (const item of gcItems) {
      if (item.subject) ids.add(item.subject.id);
      if (item.topic?.subject) ids.add(item.topic.subject.id);
    }
    selectedSubjectIds = ids;
    selectedYearId = data.selectedYearId ?? '';
    selectedGrade = data.selectedGrade ?? 1;
    // Keep URL clean
    if (browser && window.location.search) {
      history.replaceState(history.state, '', '/teacher/curriculum/yearly');
    }
  });

  function toggleSubject(subjectId: string) {
    const next = new Set(selectedSubjectIds);
    if (next.has(subjectId)) {
      next.delete(subjectId);
    } else {
      next.add(subjectId);
    }
    selectedSubjectIds = next;
  }

  function buildItemsJson(): string {
    return JSON.stringify(
      data.subjects
        .filter((s: any) => selectedSubjectIds.has(s.id))
        .map((s: any, i: number) => ({
          subjectId: s.id,
          topicId: null,
          position: i + 1
        }))
    );
  }

  async function onSelectionChange() {
    const params = new URLSearchParams();
    if (selectedYearId) params.set('yearId', selectedYearId);
    if (selectedGrade) params.set('grade', String(selectedGrade));
    await goto(`/teacher/curriculum/yearly?${params.toString()}`, { replaceState: true, noScroll: true });
    history.replaceState(history.state, '', '/teacher/curriculum/yearly');
  }

  // Use teacher's grades if available, otherwise school range
  let grades = $derived(
    data.teacherGrades?.length
      ? data.teacherGrades.map((g: number) => ({ value: g, label: gradeDisplayName(g) }))
      : data.school ? gradeOptions(data.school.minGrade, data.school.maxGrade) : []
  );

  $effect(() => {
    if (form?.success) {
      saveSuccess = true;
      setTimeout(() => { saveSuccess = false; }, 3000);
      invalidateAll();
    }
  });
</script>

<svelte:head>
  <title>{m.yearly_title()} — {m.app_name()}</title>
</svelte:head>

<div>
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-text">{m.yearly_title()}</h1>
      <p class="text-sm text-text-muted mt-1">{m.yearly_subtitle()}</p>
    </div>
    <a href="/teacher/curriculum" class="text-sm text-primary hover:underline">
      {m.yearly_back()}
    </a>
  </div>

  {#if form?.error}
    <div class="mb-4"><Alert variant="error">{form.error}</Alert></div>
  {/if}

  {#if saveSuccess}
    <div class="mb-4"><Alert variant="success">{m.yearly_saved()}</Alert></div>
  {/if}

  {#if !data.school}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">{m.yearly_no_school()}</p>
      <p class="text-sm mt-1">{m.yearly_no_school_hint()}</p>
    </div>
  {:else if data.academicYears.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">{m.yearly_no_years()}</p>
      <p class="text-sm mt-1">{m.yearly_no_years_hint()}</p>
    </div>
  {:else}
    <!-- Selectors -->
    <div class="flex flex-wrap gap-4 mb-6">
      <div>
        <label for="year-select" class="block text-sm font-medium text-text mb-1">{m.yearly_academic_year()}</label>
        <select id="year-select" class="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50" bind:value={selectedYearId} onchange={onSelectionChange}>
          {#each data.academicYears as year}
            <option value={year.id}>{year.label}{year.current ? ' (Current)' : ''}</option>
          {/each}
        </select>
      </div>
      <div>
        <label for="grade-select" class="block text-sm font-medium text-text mb-1">{m.yearly_grade_level()}</label>
        <select id="grade-select" class="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50" bind:value={selectedGrade} onchange={onSelectionChange}>
          {#each grades as grade}
            <option value={grade.value}>{grade.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Subject Checklist -->
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-text mb-3">{gradeDisplayName(selectedGrade)} Curriculum</h2>
      <div class="bg-surface rounded-xl border border-slate-100 divide-y divide-slate-100">
        {#if data.subjects.length === 0}
          <p class="text-sm text-text-muted text-center py-8">{m.yearly_no_master_subjects()}</p>
        {:else}
          {#each data.subjects as subject}
            {@const isSelected = selectedSubjectIds.has(subject.id)}
            {@const topicCount = subject.topics?.length ?? 0}
            <label class="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={isSelected}
                onchange={() => toggleSubject(subject.id)}
                class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/50"
              />
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium text-text">{subject.name}</span>
              </div>
              <span class="text-xs text-text-muted">{topicCount} topic{topicCount !== 1 ? 's' : ''}</span>
            </label>
          {/each}
        {/if}
      </div>
      <p class="text-xs text-text-muted mt-2">{selectedSubjectIds.size} of {data.subjects.length} subjects selected</p>
    </div>

    <!-- Save -->
    <form method="POST" action="?/save" use:enhance={() => { saving = true; return async ({ update }) => { saving = false; await update(); }; }}>
      <input type="hidden" name="academicYearId" value={selectedYearId} />
      <input type="hidden" name="grade" value={selectedGrade} />
      <input type="hidden" name="items" value={buildItemsJson()} />
      <Button type="submit" disabled={saving || selectedSubjectIds.size === 0} class="w-full">
        {saving ? m.yearly_saving() : `Save ${gradeDisplayName(selectedGrade)} Curriculum`}
      </Button>
    </form>
  {/if}
</div>
