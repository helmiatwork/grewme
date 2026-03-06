<script lang="ts">
  import { Card, Badge } from '$lib/components/ui';

  let { data } = $props();

  let filterSubject = $state('');
  let filterType = $state('');

  const examTypeLabels: Record<string, string> = {
    SCORE_BASED: 'Score Based',
    MULTIPLE_CHOICE: 'Multiple Choice',
    RUBRIC: 'Rubric',
    PASS_FAIL: 'Pass/Fail'
  };

  const examTypeBadgeClass: Record<string, string> = {
    SCORE_BASED: 'bg-blue-100 text-blue-700',
    MULTIPLE_CHOICE: 'bg-green-100 text-green-700',
    RUBRIC: 'bg-purple-100 text-purple-700',
    PASS_FAIL: 'bg-amber-100 text-amber-700'
  };

  const subjects = $derived(
    [...new Map(data.exams.map((e: any) => [e.subjectId, e.subjectName])).entries()].map(
      ([id, name]) => ({ id, name })
    )
  );

  const filteredExams = $derived(
    data.exams.filter((exam: any) => {
      if (filterSubject && exam.subjectId !== filterSubject) return false;
      if (filterType && exam.examType !== filterType) return false;
      return true;
    })
  );
</script>

<svelte:head>
  <title>Exams — GrewMe</title>
</svelte:head>

<div>
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-text">Exams</h1>
    <a
      href="/teacher/exams/new"
      class="inline-flex items-center gap-2 bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
    >
      + Create Exam
    </a>
  </div>

  <!-- Filter bar -->
  <div class="flex flex-wrap gap-3 mb-6">
    <select
      bind:value={filterSubject}
      class="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <option value="">All Subjects</option>
      {#each subjects as subject}
        <option value={subject.id}>{subject.name}</option>
      {/each}
    </select>
    <select
      bind:value={filterType}
      class="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      <option value="">All Types</option>
      <option value="SCORE_BASED">Score Based</option>
      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
      <option value="RUBRIC">Rubric</option>
      <option value="PASS_FAIL">Pass/Fail</option>
    </select>
  </div>

  {#if filteredExams.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">No exams yet.</p>
      <p class="text-sm mt-1">Create your first exam to get started.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each filteredExams as exam}
        <a href="/teacher/exams/{exam.id}">
          <Card hover>
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="text-base font-semibold text-text leading-tight">{exam.title}</h3>
              <span
                class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full {examTypeBadgeClass[exam.examType] ?? 'bg-slate-100 text-slate-700'}"
              >
                {examTypeLabels[exam.examType] ?? exam.examType}
              </span>
            </div>
            <p class="text-sm text-text-muted mb-3">
              {exam.subjectName} › {exam.topicName}
            </p>
            <div class="flex flex-wrap gap-2 text-xs text-text-muted">
              {#if exam.maxScore != null}
                <span class="bg-slate-100 px-2 py-0.5 rounded-full">{exam.maxScore} pts</span>
              {/if}
              {#if exam.durationMinutes != null}
                <span class="bg-slate-100 px-2 py-0.5 rounded-full">{exam.durationMinutes} min</span>
              {/if}
              <span class="bg-slate-100 px-2 py-0.5 rounded-full">
                {exam.classroomCount} classroom{exam.classroomCount !== 1 ? 's' : ''}
              </span>
            </div>
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
