<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll, goto } from '$app/navigation';
  import { Card, Button, Input, Alert } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';
  import { gradeDisplayName } from '$lib/utils/grade';

  let { data, form } = $props();

  let showNewSubjectForm = $state(false);
  let submitting = $state(false);
  let selectedGrade = $state(data.selectedGrade ?? 0);

  function countLOs(topics: Array<{ learningObjectives?: unknown[] }>): number {
    return topics.reduce((sum, t) => sum + (t.learningObjectives?.length ?? 0), 0);
  }

  function countExams(topics: Array<{ exams?: unknown[] }>): number {
    return topics.reduce((sum, t) => sum + (t.exams?.length ?? 0), 0);
  }

  let filteredSubjects = $derived.by(() => {
    if (!selectedGrade || !data.gradeCurriculum) return data.subjects;
    const gcItems = data.gradeCurriculum.gradeCurriculumItems ?? [];
    const subjectIds = new Set(gcItems.filter((i: any) => i.subject).map((i: any) => i.subject.id));
    const topicIds = new Set(gcItems.filter((i: any) => i.topic).map((i: any) => i.topic.id));
    return data.subjects.filter((s: any) => 
      subjectIds.has(s.id) || 
      s.topics?.some((t: any) => topicIds.has(t.id))
    );
  });

  function gradeTopicCount(subject: any): { filtered: number; total: number } | null {
    if (!selectedGrade || !data.gradeCurriculum) return null;
    const gcItems = data.gradeCurriculum.gradeCurriculumItems ?? [];
    const isWholeSubject = gcItems.some((i: any) => i.subject?.id === subject.id);
    if (isWholeSubject) return null; // all topics included
    const topicIds = new Set(gcItems.filter((i: any) => i.topic).map((i: any) => i.topic.id));
    const filtered = subject.topics?.filter((t: any) => topicIds.has(t.id)).length ?? 0;
    return { filtered, total: subject.topics?.length ?? 0 };
  }

  function onGradeChange() {
    const params = new URLSearchParams();
    if (selectedGrade) params.set('grade', String(selectedGrade));
    goto(`/teacher/curriculum${params.toString() ? '?' + params.toString() : ''}`);
  }

  $effect(() => {
    if (form?.success) {
      showNewSubjectForm = false;
      invalidateAll();
    }
  });

  $effect(() => {
    selectedGrade = data.selectedGrade ?? 0;
  });
</script>

<svelte:head>
  <title>{m.curriculum_title()} — {m.app_name()}</title>
</svelte:head>

<div>
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-text">{m.curriculum_title()}</h1>
    <Button onclick={() => (showNewSubjectForm = !showNewSubjectForm)}>
      {showNewSubjectForm ? m.common_cancel() : m.curriculum_new_subject()}
    </Button>
  </div>

  {#if form?.error}
    <div class="mb-4">
      <Alert variant="error">{form.error}</Alert>
    </div>
  {/if}

  <!-- Grade Filter -->
  {#if data.teacherGrades?.length}
    <div class="mb-6">
      <label for="grade-filter" class="block text-sm font-medium text-text mb-1">{m.curriculum_filter_by_grade()}</label>
      <select
        id="grade-filter"
        class="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
        bind:value={selectedGrade}
        onchange={onGradeChange}
      >
        <option value={0}>{m.curriculum_all_subjects()}</option>
        {#each data.teacherGrades as grade}
          <option value={grade}>{gradeDisplayName(grade)}</option>
        {/each}
      </select>
    </div>
  {/if}

  {#if showNewSubjectForm}
    <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
      <h2 class="text-lg font-semibold text-text mb-4">{m.curriculum_new_subject()}</h2>
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
            <label for="name" class="block text-sm font-medium text-text mb-1">{m.curriculum_subject_name()}</label>
            <Input id="name" name="name" placeholder={m.curriculum_subject_name_placeholder()} required />
          </div>
          <div>
            <label for="description" class="block text-sm font-medium text-text mb-1">{m.curriculum_description_optional()}</label>
            <Input id="description" name="description" placeholder={m.curriculum_description_placeholder()} />
          </div>
          <div class="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? m.curriculum_creating() : m.curriculum_create_subject()}
            </Button>
            <Button variant="ghost" onclick={() => (showNewSubjectForm = false)}>{m.common_cancel()}</Button>
          </div>
        </div>
      </form>
    </div>
  {/if}

  {#if !data.schoolId}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">{m.curriculum_no_school()}</p>
      <p class="text-sm mt-1">{m.curriculum_no_school_hint()}</p>
    </div>
  {:else if filteredSubjects.length === 0}
    <div class="text-center py-12 text-text-muted">
      {#if selectedGrade}
        <p class="text-lg">{m.curriculum_no_grade_subjects()}</p>
        <p class="text-sm mt-1">{m.curriculum_no_grade_subjects_hint()}</p>
      {:else}
        <p class="text-lg">{m.curriculum_no_subjects()}</p>
        <p class="text-sm mt-1">{m.curriculum_no_subjects_hint()}</p>
      {/if}
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each filteredSubjects as subject}
        {@const topicCount = subject.topics?.length ?? 0}
        {@const loCount = countLOs(subject.topics ?? [])}
        {@const examCount = countExams(subject.topics ?? [])}
        {@const gradeTopics = gradeTopicCount(subject)}
        <a href="/teacher/curriculum/{subject.id}{selectedGrade ? `?grade=${selectedGrade}` : ''}">
          <Card hover>
            <h3 class="text-lg font-semibold text-text">{subject.name}</h3>
            {#if subject.description}
              <p class="text-sm text-text-muted mt-1 line-clamp-2">{subject.description}</p>
            {/if}
            <div class="flex flex-wrap gap-2 mt-3">
              <span class="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                {#if gradeTopics}
                  {gradeTopics.filtered} of {gradeTopics.total} topics
                {:else}
                  {topicCount} topic{topicCount !== 1 ? 's' : ''}
                {/if}
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
