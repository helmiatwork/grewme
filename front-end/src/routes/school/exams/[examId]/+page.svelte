<script lang="ts">
  let { data } = $props();

  const examTypeBadge: Record<string, string> = {
    score_based: 'bg-blue-100 text-blue-700',
    multiple_choice: 'bg-green-100 text-green-700',
    rubric_based: 'bg-purple-100 text-purple-700',
    pass_fail: 'bg-amber-100 text-amber-700'
  };

  const statusBadge: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    scheduled: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    closed: 'bg-amber-100 text-amber-700',
    archived: 'bg-gray-100 text-gray-500'
  };

  const submissionStatusBadge: Record<string, string> = {
    in_progress: 'bg-yellow-100 text-yellow-700',
    submitted: 'bg-blue-100 text-blue-700',
    graded: 'bg-green-100 text-green-700'
  };

  function examTypeLabel(type: string) {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function formatDate(dt: string | null) {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const exam = $derived(data.exam);
</script>

<svelte:head>
  <title>{exam?.title ?? 'Exam'} — GrewMe</title>
</svelte:head>

<div>
  <!-- Breadcrumb -->
  <nav class="text-sm text-text-muted mb-4">
    <a href="/school/exams" class="hover:text-text">Exams</a>
    <span class="mx-2">›</span>
    <span class="text-text">{exam?.title}</span>
  </nav>

  <!-- Exam Header -->
  <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
    <div class="flex items-start justify-between flex-wrap gap-4">
      <div>
        <div class="flex items-center gap-3 mb-2">
          <h1 class="text-2xl font-bold text-text">{exam?.title}</h1>
          <span class="text-sm px-2.5 py-1 rounded-full font-medium {examTypeBadge[exam?.examType ?? ''] ?? 'bg-slate-100 text-slate-700'}">
            {examTypeLabel(exam?.examType ?? '')}
          </span>
        </div>
        {#if exam?.description}
          <p class="text-text-muted mb-3">{exam?.description}</p>
        {/if}
        <p class="text-sm text-text-muted">
          <a href="/school/curriculum/{exam?.topic?.subject?.id}" class="hover:text-text">{exam?.topic?.subject?.name}</a>
          <span class="mx-1">›</span>
          <a href="/school/curriculum/{exam?.topic?.subject?.id}/{exam?.topic?.id}" class="hover:text-text">{exam?.topic?.name}</a>
        </p>
      </div>
      <div class="flex flex-col gap-1 text-sm text-text-muted text-right">
        {#if exam?.maxScore}
          <span>Max score: <strong class="text-text">{exam?.maxScore}</strong></span>
        {/if}
        {#if exam?.durationMinutes}
          <span>Duration: <strong class="text-text">{exam?.durationMinutes} min</strong></span>
        {/if}
      </div>
    </div>
  </div>

  <!-- Questions / Criteria -->
  {#if exam?.examType === 'rubric_based' && exam?.rubricCriteria?.length > 0}
    <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
      <h2 class="text-lg font-semibold text-text mb-4">Rubric Criteria</h2>
      <div class="space-y-3">
        {#each exam.rubricCriteria as criterion}
          <div class="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p class="font-medium text-text">{criterion.name}</p>
              {#if criterion.description}
                <p class="text-sm text-text-muted mt-0.5">{criterion.description}</p>
              {/if}
            </div>
            <span class="text-sm font-medium text-text ml-4">{criterion.maxScore} pts</span>
          </div>
        {/each}
      </div>
    </div>
  {:else if exam?.examQuestions?.length > 0}
    <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
      <h2 class="text-lg font-semibold text-text mb-4">Questions</h2>
      <div class="space-y-3">
        {#each exam.examQuestions as question}
          <div class="p-3 bg-slate-50 rounded-lg">
            <div class="flex items-start justify-between">
              <p class="text-text">{question.position}. {question.questionText}</p>
              <span class="text-sm font-medium text-text-muted ml-4 whitespace-nowrap">{question.points} pts</span>
            </div>
            {#if question.options?.length}
              <ul class="mt-2 space-y-1">
                {#each question.options as option}
                  <li class="text-sm text-text-muted pl-4">• {option}</li>
                {/each}
              </ul>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Assigned Classrooms -->
  <h2 class="text-xl font-semibold text-text mb-4">Assigned Classrooms</h2>

  {#if !exam?.classroomExams || exam.classroomExams.length === 0}
    <div class="text-center py-8 text-text-muted mb-6">
      <p>This exam hasn't been assigned to any classrooms yet.</p>
    </div>
  {:else}
    <div class="space-y-4 mb-6">
      {#each exam.classroomExams as ce}
        <div class="bg-surface rounded-xl border border-slate-100 p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-text">{ce.classroom.name}</h3>
            <span class="text-xs px-2 py-0.5 rounded-full font-medium {statusBadge[ce.status] ?? 'bg-slate-100 text-slate-600'}">
              {ce.status}
            </span>
          </div>
          <div class="flex gap-4 text-xs text-text-muted mb-4">
            {#if ce.scheduledAt}
              <span>Scheduled: {formatDate(ce.scheduledAt)}</span>
            {/if}
            {#if ce.dueAt}
              <span>Due: {formatDate(ce.dueAt)}</span>
            {/if}
          </div>

          <!-- Submissions -->
          {#if ce.examSubmissions?.length > 0}
            <div class="border-t border-slate-100 pt-3">
              <p class="text-xs font-medium text-text-muted uppercase tracking-wide mb-2">
                Submissions ({ce.examSubmissions.length})
              </p>
              <div class="space-y-2">
                {#each ce.examSubmissions as submission}
                  <div class="flex items-center justify-between text-sm">
                    <span class="text-text">{submission.student.name}</span>
                    <div class="flex items-center gap-3">
                      {#if submission.score !== null}
                        <span class="text-text-muted">{submission.score} pts</span>
                      {/if}
                      {#if submission.passed !== null}
                        <span class="text-xs {submission.passed ? 'text-green-600' : 'text-red-600'}">
                          {submission.passed ? 'Passed' : 'Failed'}
                        </span>
                      {/if}
                      <span class="text-xs px-2 py-0.5 rounded-full {submissionStatusBadge[submission.status] ?? 'bg-slate-100 text-slate-600'}">
                        {submission.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <p class="text-sm text-text-muted">No submissions yet.</p>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
