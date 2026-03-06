<script lang="ts">
  let { data } = $props();

  let filterSubject = $state('');
  let filterType = $state('');

  const examTypeBadge: Record<string, string> = {
    SCORE_BASED: 'bg-blue-100 text-blue-700',
    MULTIPLE_CHOICE: 'bg-green-100 text-green-700',
    RUBRIC: 'bg-purple-100 text-purple-700',
    PASS_FAIL: 'bg-amber-100 text-amber-700'
  };

  const examTypeLabels: Record<string, string> = {
    SCORE_BASED: 'Score Based',
    MULTIPLE_CHOICE: 'Multiple Choice',
    RUBRIC: 'Rubric',
    PASS_FAIL: 'Pass/Fail'
  };

  function examTypeLabel(type: string) {
    return examTypeLabels[type] ?? type;
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
    <h1 class="text-2xl font-bold text-text">School Exams</h1>
  </div>

  <!-- Filters -->
  <div class="flex flex-wrap gap-3 mb-6">
    <select
      bind:value={filterSubject}
      class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-text bg-white"
    >
      <option value="">All Subjects</option>
      {#each data.subjects as subject}
        <option value={subject.id}>{subject.name}</option>
      {/each}
    </select>

    <select
      bind:value={filterType}
      class="rounded-lg border border-slate-200 px-3 py-2 text-sm text-text bg-white"
    >
      <option value="">All Types</option>
      {#each examTypes as type}
        <option value={type}>{examTypeLabel(type)}</option>
      {/each}
    </select>
  </div>

  {#if filteredExams.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">No exams found</p>
      <p class="text-sm mt-1">Exams are created by teachers within topics.</p>
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
