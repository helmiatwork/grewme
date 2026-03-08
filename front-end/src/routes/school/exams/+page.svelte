<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  let filterSubject = $state('');
  let filterType = $state('');

  const examTypeBadge: Record<string, string> = {
    SCORE_BASED: 'bg-blue-100 text-blue-700',
    MULTIPLE_CHOICE: 'bg-green-100 text-green-700',
    RUBRIC: 'bg-purple-100 text-purple-700',
    PASS_FAIL: 'bg-amber-100 text-amber-700'
  };

  function examTypeLabel(type: string) {
    const labels: Record<string, string> = {
      SCORE_BASED: m.exam_type_score_based(),
      MULTIPLE_CHOICE: m.exam_type_multiple_choice(),
      RUBRIC: m.exam_type_rubric(),
      PASS_FAIL: m.exam_type_pass_fail()
    };
    return labels[type] ?? type;
  }

  const filteredExams = $derived(
    data.exams.filter((exam: any) => {
      const matchSubject = !filterSubject || exam.topic?.subject?.id === filterSubject;
      const matchType = !filterType || exam.examType === filterType;
      return matchSubject && matchType;
    })
  );

  const examTypes = ['SCORE_BASED', 'MULTIPLE_CHOICE', 'RUBRIC', 'PASS_FAIL'];
</script>

<svelte:head>
  <title>Exams — GrewMe</title>
</svelte:head>

<div>
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-text">{m.exam_school_title()}</h1>
  </div>

  <!-- Filters -->
  <div class="flex flex-wrap gap-3 mb-6">
    <select
      bind:value={filterSubject}
      class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-text bg-white"
    >
      <option value="">{m.exam_filter_all_subjects()}</option>
      {#each data.subjects as subject}
        <option value={subject.id}>{subject.name}</option>
      {/each}
    </select>

    <select
      bind:value={filterType}
      class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-text bg-white"
    >
      <option value="">{m.exam_filter_all_types()}</option>
      {#each examTypes as type}
        <option value={type}>{examTypeLabel(type)}</option>
      {/each}
    </select>
  </div>

  {#if filteredExams.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">{m.exam_school_no_exams()}</p>
      <p class="text-sm mt-1">{m.exam_school_no_exams_hint()}</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each filteredExams as exam}
        <a href="/school/exams/{exam.id}">
          <div class="bg-surface rounded-xl border border-slate-100 p-5 hover:border-primary/30 transition-colors h-full">
            <div class="flex items-start justify-between mb-2">
              <h3 class="text-base font-semibold text-text flex-1 pr-2">{exam.title}</h3>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap {examTypeBadge[exam.examType] ?? 'bg-slate-100 text-slate-700'}">
                {examTypeLabel(exam.examType)}
              </span>
            </div>
            <p class="text-xs text-text-muted mb-3">
              {exam.topic?.subject?.name} › {exam.topic?.name}
            </p>
            <div class="flex flex-wrap gap-3 text-xs text-text-muted">
              {#if exam.maxScore}
                <span>Max: {exam.maxScore} pts</span>
              {/if}
              {#if exam.durationMinutes}
                <span>{exam.durationMinutes} min</span>
              {/if}
            </div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>
