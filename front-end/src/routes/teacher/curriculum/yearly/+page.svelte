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
  let expandedSubjects = $state<Set<string>>(new Set());

  // Set of selected topic IDs for the current grade
  let selectedTopicIds = $state<Set<string>>(new Set());

  // Sync from server data — extract topic IDs from curriculum items
  $effect(() => {
    const gcItems = data.gradeCurriculum?.gradeCurriculumItems ?? [];
    const ids = new Set<string>();
    for (const item of gcItems) {
      if (item.subject) {
        // Subject-level item = all topics in that subject are selected
        for (const topic of item.subject.topics ?? []) {
          ids.add(topic.id);
        }
      }
      if (item.topic) {
        ids.add(item.topic.id);
      }
    }
    selectedTopicIds = ids;
    selectedYearId = data.selectedYearId ?? '';
    selectedGrade = data.selectedGrade ?? 1;
    if (browser && window.location.search) {
      history.replaceState(history.state, '', '/teacher/curriculum/yearly');
    }
  });

  function toggleExpand(subjectId: string) {
    const next = new Set(expandedSubjects);
    if (next.has(subjectId)) next.delete(subjectId);
    else next.add(subjectId);
    expandedSubjects = next;
  }

  function toggleSubject(subject: any) {
    const topicIds = (subject.topics ?? []).map((t: any) => t.id);
    const allSelected = topicIds.every((id: string) => selectedTopicIds.has(id));
    const next = new Set(selectedTopicIds);
    if (allSelected) {
      topicIds.forEach((id: string) => next.delete(id));
    } else {
      topicIds.forEach((id: string) => next.add(id));
    }
    selectedTopicIds = next;
  }

  function toggleTopic(topicId: string) {
    const next = new Set(selectedTopicIds);
    if (next.has(topicId)) next.delete(topicId);
    else next.add(topicId);
    selectedTopicIds = next;
  }

  function subjectState(subject: any): 'all' | 'some' | 'none' {
    const topicIds = (subject.topics ?? []).map((t: any) => t.id);
    if (topicIds.length === 0) return 'none';
    const count = topicIds.filter((id: string) => selectedTopicIds.has(id)).length;
    if (count === topicIds.length) return 'all';
    if (count > 0) return 'some';
    return 'none';
  }

  function selectedTopicCountFor(subject: any): number {
    return (subject.topics ?? []).filter((t: any) => selectedTopicIds.has(t.id)).length;
  }

  function buildItemsJson(): string {
    let position = 0;
    const items: Array<{ subjectId: string | null; topicId: string | null; position: number }> = [];
    for (const subject of data.subjects) {
      const topics = subject.topics ?? [];
      const selectedInSubject = topics.filter((t: any) => selectedTopicIds.has(t.id));
      if (selectedInSubject.length === 0) continue;
      if (selectedInSubject.length === topics.length) {
        // All topics selected — save as subject-level item
        items.push({ subjectId: subject.id, topicId: null, position: ++position });
      } else {
        // Partial — save individual topic items
        for (const topic of selectedInSubject) {
          items.push({ subjectId: null, topicId: topic.id, position: ++position });
        }
      }
    }
    return JSON.stringify(items);
  }

  async function onSelectionChange() {
    const params = new URLSearchParams();
    if (selectedYearId) params.set('yearId', selectedYearId);
    if (selectedGrade) params.set('grade', String(selectedGrade));
    await goto(`/teacher/curriculum/yearly?${params.toString()}`, { replaceState: true, noScroll: true });
    history.replaceState(history.state, '', '/teacher/curriculum/yearly');
  }

  let grades = $derived(
    data.teacherGrades?.length
      ? data.teacherGrades.map((g: number) => ({ value: g, label: gradeDisplayName(g) }))
      : data.school ? gradeOptions(data.school.minGrade, data.school.maxGrade) : []
  );

  let totalSelectedTopics = $derived(selectedTopicIds.size);

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

    <!-- Subject & Topic Checklist -->
    <div class="mb-6">
      <h2 class="text-lg font-semibold text-text mb-3">{gradeDisplayName(selectedGrade)} Curriculum</h2>
      <div class="bg-surface rounded-xl border border-slate-100">
        {#if data.subjects.length === 0}
          <p class="text-sm text-text-muted text-center py-8">{m.yearly_no_master_subjects()}</p>
        {:else}
          {#each data.subjects as subject}
            {@const state = subjectState(subject)}
            {@const isExpanded = expandedSubjects.has(subject.id)}
            {@const topicCount = subject.topics?.length ?? 0}
            {@const selectedCount = selectedTopicCountFor(subject)}

            <!-- Subject row -->
            <div class="border-b border-slate-100 last:border-b-0">
              <div class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                <!-- Expand toggle -->
                <button
                  class="text-text-muted hover:text-text transition-transform flex-shrink-0 {isExpanded ? 'rotate-90' : ''}"
                  onclick={() => toggleExpand(subject.id)}
                  aria-label="Toggle topics"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </button>

                <!-- Subject checkbox -->
                <input
                  type="checkbox"
                  checked={state === 'all'}
                  indeterminate={state === 'some'}
                  onchange={() => toggleSubject(subject)}
                  class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/50"
                />

                <!-- Subject name (clickable to expand) -->
                <button class="flex-1 min-w-0 text-left" onclick={() => toggleExpand(subject.id)}>
                  <span class="text-sm font-medium text-text">{subject.name}</span>
                </button>

                <!-- Topic count badge -->
                <span class="text-xs text-text-muted flex-shrink-0">
                  {#if selectedCount > 0 && selectedCount < topicCount}
                    {selectedCount}/{topicCount} topics
                  {:else}
                    {topicCount} topic{topicCount !== 1 ? 's' : ''}
                  {/if}
                </span>
              </div>

              <!-- Topic list (expanded) -->
              {#if isExpanded}
                <div class="pb-2">
                  {#each subject.topics ?? [] as topic}
                    {@const isTopicSelected = selectedTopicIds.has(topic.id)}
                    <label class="flex items-center gap-3 pl-14 pr-4 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={isTopicSelected}
                        onchange={() => toggleTopic(topic.id)}
                        class="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary/50"
                      />
                      <span class="text-sm text-text">{topic.name}</span>
                    </label>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
      <p class="text-xs text-text-muted mt-2">{totalSelectedTopics} topic{totalSelectedTopics !== 1 ? 's' : ''} selected</p>
    </div>

    <!-- Save -->
    <form method="POST" action="?/save" use:enhance={() => { saving = true; return async ({ update }) => { saving = false; await update(); }; }}>
      <input type="hidden" name="academicYearId" value={selectedYearId} />
      <input type="hidden" name="grade" value={selectedGrade} />
      <input type="hidden" name="items" value={buildItemsJson()} />
      <Button type="submit" disabled={saving || totalSelectedTopics === 0} class="w-full">
        {saving ? m.yearly_saving() : `Save ${gradeDisplayName(selectedGrade)} Curriculum`}
      </Button>
    </form>
  {/if}
</div>
