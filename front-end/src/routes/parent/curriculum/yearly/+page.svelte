<script lang="ts">
  import { goto } from '$app/navigation';
  import { Card, Alert } from '$lib/components/ui';
  import { gradeDisplayName } from '$lib/utils/grade';
  import type { GradeCurriculumItem as GCItem } from '$lib/api/types';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  let selectedYearId = $state(data.selectedYearId ?? '');
  let selectedGrade = $state(data.selectedGrade ?? 1);

  let grades = $derived(
    data.childGrades?.length
      ? data.childGrades.map((g: number) => ({ value: g, label: gradeDisplayName(g) }))
      : data.school ? [{ value: data.school.minGrade, label: gradeDisplayName(data.school.minGrade) }] : []
  );

  function onSelectionChange() {
    const params = new URLSearchParams();
    if (selectedYearId) params.set('yearId', selectedYearId);
    if (selectedGrade) params.set('grade', String(selectedGrade));
    goto(`/parent/curriculum/yearly?${params.toString()}`);
  }

  let items = $derived(data.gradeCurriculum?.gradeCurriculumItems ?? []);
</script>

<svelte:head>
  <title>Yearly Curriculum — GrewMe</title>
</svelte:head>

<div>
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold text-text">{m.yearly_title()}</h1>
      <p class="text-sm text-text-muted mt-1">{m.yearly_subtitle()}</p>
    </div>
    <a href="/parent/curriculum" class="text-sm text-primary hover:underline">
      {m.yearly_back()}
    </a>
  </div>

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
            <option value={year.id}>{year.label}{year.current ? ` (${m.yearly_current_indicator()})` : ''}</option>
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

    <!-- Curriculum list (read-only) -->
    <div>
      <h2 class="text-lg font-semibold text-text mb-3">
        {gradeDisplayName(selectedGrade)} Curriculum
        <span class="text-sm font-normal text-text-muted ml-2">({items.length} item{items.length !== 1 ? 's' : ''})</span>
      </h2>

      {#if items.length === 0}
        <div class="bg-surface rounded-xl border border-slate-100 p-8 text-center text-text-muted">
          <p class="text-sm">{m.yearly_empty_hint()}</p>
        </div>
      {:else}
        <div class="bg-surface rounded-xl border border-slate-100 p-4 space-y-2">
          {#each items as item, index}
            <div class="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-100">
              <span class="text-xs text-text-muted font-mono w-5 text-center flex-shrink-0">{index + 1}</span>
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium text-text">{item.displayName}</span>
                {#if item.topic?.subject}
                  <span class="text-xs text-text-muted ml-1">({item.topic.subject.name})</span>
                {/if}
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 {item.subject ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}">
                {item.subject ? 'subject' : 'topic'}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
