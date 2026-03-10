<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { browser } from '$app/environment';
  import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { Card, Button, Alert } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';
  import { gradeDisplayName, gradeOptions } from '$lib/utils/grade';
  import type { GradeCurriculumItem as GCItem } from '$lib/api/types';

  let { data, form } = $props();

  const flipDurationMs = 200;
  let nextId = 1000;

  let selectedYearId = $state(data.selectedYearId ?? '');
  let selectedGrade = $state(data.selectedGrade ?? 1);
  let saving = $state(false);
  let saveSuccess = $state(false);
  let expandedSubjects = $state<Set<string>>(new Set());

  interface DndItem {
    id: string | number;
    subjectId?: string;
    topicId?: string;
    displayName: string;
    type: 'subject' | 'topic';
    subjectName?: string;
  }

  let curriculumItems = $state<DndItem[]>([]);

  // Sync curriculum items when data changes (grade/year selection)
  $effect(() => {
    curriculumItems = data.gradeCurriculum?.gradeCurriculumItems?.map((item: GCItem) => ({
      id: item.id,
      subjectId: item.subject?.id,
      topicId: item.topic?.id,
      displayName: item.displayName,
      type: (item.subject ? 'subject' : 'topic') as 'subject' | 'topic',
      subjectName: item.topic?.subject?.name
    })) ?? [];
    selectedYearId = data.selectedYearId ?? '';
    selectedGrade = data.selectedGrade ?? 1;
    // Keep URL clean — strip query params after data loads
    if (browser && window.location.search) {
      history.replaceState(history.state, '', '/teacher/curriculum/yearly');
    }
  });

  function toggleSubject(subjectId: string) {
    const next = new Set(expandedSubjects);
    if (next.has(subjectId)) next.delete(subjectId);
    else next.add(subjectId);
    expandedSubjects = next;
  }

  function addToCurriculum(item: DndItem) {
    if (curriculumItems.some(ci => (item.subjectId && ci.subjectId === item.subjectId) || (item.topicId && ci.topicId === item.topicId))) return;
    curriculumItems = [...curriculumItems, { ...item, id: nextId++ }];
  }

  function removeFromCurriculum(index: number) {
    curriculumItems = curriculumItems.filter((_, i) => i !== index);
  }

  function handleCurriculumConsider(e: CustomEvent<{ items: DndItem[] }>) {
    curriculumItems = e.detail.items.map((it) => ({ ...it }));
  }

  function handleCurriculumFinalize(e: CustomEvent<{ items: DndItem[] }>) {
    curriculumItems = e.detail.items.map((it) => ({ ...it }));
  }

  async function onSelectionChange() {
    const params = new URLSearchParams();
    if (selectedYearId) params.set('yearId', selectedYearId);
    if (selectedGrade) params.set('grade', String(selectedGrade));
    await goto(`/teacher/curriculum/yearly?${params.toString()}`, { replaceState: true, noScroll: true });
    history.replaceState(history.state, '', '/teacher/curriculum/yearly');
  }

  function buildItemsJson(): string {
    return JSON.stringify(
      curriculumItems
        .filter(item => !(item as any)[SHADOW_ITEM_MARKER_PROPERTY_NAME])
        .map((item, i) => ({
          subjectId: item.subjectId || null,
          topicId: item.topicId || null,
          position: i + 1
        }))
    );
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

    <!-- Two-panel layout -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left: Master Curriculum -->
      <div>
        <h2 class="text-lg font-semibold text-text mb-3">{m.yearly_master_curriculum()}</h2>
        <div class="bg-surface rounded-xl border border-slate-100 p-4 max-h-[600px] overflow-y-auto">
          {#if data.subjects.length === 0}
            <p class="text-sm text-text-muted text-center py-4">{m.yearly_no_master_subjects()}</p>
          {:else}
            <div class="space-y-1">
              {#each data.subjects as subject}
                {@const inCurriculum = curriculumItems.some(ci => ci.subjectId === subject.id)}
                {@const isExpanded = expandedSubjects.has(subject.id)}
                <div>
                  <div class="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 group {inCurriculum ? 'opacity-50' : ''}">
                    <button class="text-text-muted hover:text-text transition-transform {isExpanded ? 'rotate-90' : ''}" onclick={() => toggleSubject(subject.id)} aria-label="Toggle topics">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div class="flex-1 min-w-0">
                      <span class="text-sm font-medium text-text">{subject.name}</span>
                      <span class="text-xs text-text-muted ml-1">({subject.topics?.length ?? 0} topics)</span>
                    </div>
                    <button class="opacity-0 group-hover:opacity-100 text-xs bg-primary text-white px-2 py-1 rounded transition-opacity disabled:opacity-30" onclick={() => addToCurriculum({ id: `master-subject-${subject.id}`, subjectId: subject.id, displayName: `${subject.name} (all topics)`, type: 'subject' })} disabled={inCurriculum}>{m.yearly_add_all()}</button>
                  </div>
                  {#if isExpanded}
                    <div class="ml-6 space-y-0.5">
                      {#each subject.topics ?? [] as topic}
                        {@const topicInCurriculum = curriculumItems.some(ci => ci.topicId === topic.id)}
                        <div class="flex items-center gap-2 p-1.5 pl-3 rounded hover:bg-slate-50 group {topicInCurriculum ? 'opacity-50' : ''}">
                          <span class="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0"></span>
                          <span class="text-sm text-text flex-1">{topic.name}</span>
                          <button class="opacity-0 group-hover:opacity-100 text-xs bg-primary/80 text-white px-2 py-0.5 rounded transition-opacity disabled:opacity-30" onclick={() => addToCurriculum({ id: `master-topic-${topic.id}`, topicId: topic.id, displayName: topic.name, type: 'topic', subjectName: subject.name })} disabled={topicInCurriculum}>+ Add</button>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>

      <!-- Right: Yearly Curriculum (DnD zone) -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-semibold text-text">{gradeDisplayName(selectedGrade)} Curriculum</h2>
          <span class="text-xs text-text-muted">{curriculumItems.length} item{curriculumItems.length !== 1 ? 's' : ''}</span>
        </div>

        <div
          class="bg-surface rounded-xl border border-slate-100 p-4 min-h-[200px] max-h-[600px] overflow-y-auto"
          use:dndzone={{ items: curriculumItems, flipDurationMs, dropTargetStyle: { outline: '2px dashed #6366f1', outlineOffset: '-2px' } }}
          onconsider={handleCurriculumConsider}
          onfinalize={handleCurriculumFinalize}
        >
          {#if curriculumItems.length === 0}
            <div class="flex items-center justify-center h-32 text-text-muted text-sm">
              <p>{m.yearly_empty_hint()}</p>
            </div>
          {/if}
          {#each curriculumItems as item, index (item.id)}
            <div class="flex items-center gap-3 p-3 mb-2 bg-white rounded-lg border border-slate-100 shadow-sm cursor-grab active:cursor-grabbing" animate:flip={{ duration: flipDurationMs }}>
              <span class="text-slate-300 flex-shrink-0"><svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" /><circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" /><circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" /></svg></span>
              <span class="text-xs text-text-muted font-mono w-5 text-center flex-shrink-0">{index + 1}</span>
              <div class="flex-1 min-w-0">
                <span class="text-sm font-medium text-text">{item.displayName}</span>
                {#if item.type === 'topic' && item.subjectName}
                  <span class="text-xs text-text-muted ml-1">({item.subjectName})</span>
                {/if}
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full flex-shrink-0 {item.type === 'subject' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}">{item.type}</span>
              <button class="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0" onclick={() => removeFromCurriculum(index)} aria-label="Remove">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          {/each}
        </div>

        <div class="mt-4">
          <form method="POST" action="?/save" use:enhance={() => { saving = true; return async ({ update }) => { saving = false; await update(); }; }}>
            <input type="hidden" name="academicYearId" value={selectedYearId} />
            <input type="hidden" name="grade" value={selectedGrade} />
            <input type="hidden" name="items" value={buildItemsJson()} />
            <Button type="submit" disabled={saving || curriculumItems.length === 0} class="w-full">
              {saving ? m.yearly_saving() : `Save ${gradeDisplayName(selectedGrade)} Curriculum`}
            </Button>
          </form>
        </div>
      </div>
    </div>
  {/if}
</div>
