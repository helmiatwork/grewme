<script lang="ts">
  import { enhance } from '$app/forms';
  import { Alert, Button } from '$lib/components/ui';

  let { data, form } = $props();

  let submitting = $state(false);

  const submission = $derived(data.submission);
  const exam = $derived(submission?.classroomExam?.exam);

  // Question scores state: map from examQuestionId → score
  let questionScores = $state<Record<string, number>>({});
  // Rubric scores state: map from criteriaId → { score, comment }
  let rubricScores = $state<Record<string, { score: number; comment: string }>>({});
  // Pass/Fail
  let passed = $state<boolean | null>(submission?.passed ?? null);

  // Initialize from existing answers/scores
  $effect(() => {
    if (submission?.examAnswers) {
      const init: Record<string, number> = {};
      for (const answer of submission.examAnswers) {
        init[answer.examQuestion.id] = answer.pointsAwarded ?? 0;
      }
      questionScores = init;
    }
    if (submission?.rubricScores) {
      const init: Record<string, { score: number; comment: string }> = {};
      for (const rs of submission.rubricScores) {
        init[rs.rubricCriteria.id] = { score: rs.score ?? 0, comment: rs.comment ?? '' };
      }
      rubricScores = init;
    }
    if (submission?.passed != null) {
      passed = submission.passed;
    }
  });

  // Computed total
  const totalScore = $derived(() => {
    if (exam?.examType === 'RUBRIC') {
      return Object.values(rubricScores).reduce((sum, rs) => sum + (rs.score || 0), 0);
    }
    return Object.values(questionScores).reduce((sum, s) => sum + (s || 0), 0);
  });

  const questionScoresJson = $derived(
    JSON.stringify(
      Object.entries(questionScores).map(([examQuestionId, score]) => ({ examQuestionId, score }))
    )
  );

  const rubricScoresJson = $derived(
    JSON.stringify(
      Object.entries(rubricScores).map(([rubricCriteriaId, { score, comment }]) => ({
        rubricCriteriaId,
        score,
        comment: comment || null
      }))
    )
  );

  function getAnswer(questionId: string) {
    return submission?.examAnswers?.find((a: any) => a.examQuestion.id === questionId);
  }
</script>

<svelte:head>
  <title>Grade Submission — GrewMe</title>
</svelte:head>

<div class="max-w-2xl">
  <!-- Breadcrumb -->
  <nav class="text-sm text-text-muted mb-4">
    <a href="/teacher/exams" class="hover:text-primary">Exams</a>
    <span class="mx-2">›</span>
    <a href="/teacher/exams/{exam?.id}" class="hover:text-primary">{exam?.title}</a>
    <span class="mx-2">›</span>
    <span class="text-text">Grade › {submission?.student?.name}</span>
  </nav>

  <h1 class="text-2xl font-bold text-text mb-1">Grade Submission</h1>
  <p class="text-text-muted text-sm mb-6">Student: {submission?.student?.name}</p>

  {#if form?.error}
    <div class="mb-4"><Alert variant="error">{form.error}</Alert></div>
  {/if}

  <form
    method="POST"
    action="?/grade"
    use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        submitting = false;
        await update();
      };
    }}
  >
    <!-- Hidden serialized scores -->
    {#if exam?.examType !== 'RUBRIC' && exam?.examType !== 'PASS_FAIL'}
      <input type="hidden" name="questionScores" value={questionScoresJson} />
    {/if}
    {#if exam?.examType === 'RUBRIC'}
      <input type="hidden" name="rubricScores" value={rubricScoresJson} />
    {/if}
    {#if exam?.examType === 'PASS_FAIL'}
      <input type="hidden" name="passed" value={passed === null ? '' : String(passed)} />
    {/if}

    <!-- Score Based: questions with score input -->
    {#if exam?.examType === 'SCORE_BASED'}
      <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6 space-y-4">
        <h2 class="text-lg font-semibold text-text">Questions</h2>
        {#each exam.examQuestions ?? [] as question, i}
          {@const answer = getAnswer(question.id)}
          <div class="border border-slate-100 rounded-lg p-4">
            <div class="flex items-start justify-between gap-2 mb-3">
              <p class="text-text font-medium">{i + 1}. {question.questionText}</p>
              <span class="text-xs text-text-muted shrink-0">max {question.points} pts</span>
            </div>
            {#if answer?.selectedAnswer}
              <div class="bg-slate-50 rounded-lg px-3 py-2 text-sm text-text mb-3">
                {answer.selectedAnswer}
              </div>
            {/if}
            <div class="flex items-center gap-3">
              <label class="text-sm text-text-muted">Score:</label>
              <input
                type="number"
                min="0"
                max={question.points}
                value={questionScores[question.id] ?? 0}
                oninput={(e) => {
                  questionScores[question.id] = Math.min(
                    question.points,
                    Math.max(0, parseInt((e.target as HTMLInputElement).value, 10) || 0)
                  );
                }}
                class="w-20 text-sm border border-slate-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span class="text-sm text-text-muted">/ {question.points}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Multiple Choice: auto-graded with override -->
    {#if exam?.examType === 'MULTIPLE_CHOICE'}
      <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6 space-y-4">
        <h2 class="text-lg font-semibold text-text">Questions (Auto-Graded)</h2>
        {#each exam.examQuestions ?? [] as question, i}
          {@const answer = getAnswer(question.id)}
          <div class="border border-slate-100 rounded-lg p-4">
            <div class="flex items-start justify-between gap-2 mb-2">
              <p class="text-text font-medium">{i + 1}. {question.questionText}</p>
              <span class="text-xs text-text-muted shrink-0">max {question.points} pts</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span class="text-text-muted">Student's answer:</span>
                <span class="ml-1 font-medium text-text">{answer?.selectedAnswer ?? '—'}</span>
              </div>
              <div>
                <span class="text-text-muted">Correct:</span>
                <span class="ml-1 font-medium text-green-700">{question.correctAnswer}</span>
              </div>
            </div>
            {#if answer}
              <div
                class="text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-3 {answer.correct
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'}"
              >
                {answer.correct ? '✓ Correct' : '✗ Incorrect'}
              </div>
            {/if}
            <div class="flex items-center gap-3">
              <label class="text-sm text-text-muted">Override score:</label>
              <input
                type="number"
                min="0"
                max={question.points}
                value={questionScores[question.id] ?? (answer?.pointsAwarded ?? (answer?.correct ? question.points : 0))}
                oninput={(e) => {
                  questionScores[question.id] = Math.min(
                    question.points,
                    Math.max(0, parseInt((e.target as HTMLInputElement).value, 10) || 0)
                  );
                }}
                class="w-20 text-sm border border-slate-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span class="text-sm text-text-muted">/ {question.points}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Rubric Based: score per criterion with comment -->
    {#if exam?.examType === 'RUBRIC'}
      <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6 space-y-4">
        <h2 class="text-lg font-semibold text-text">Rubric Criteria</h2>
        {#each exam.rubricCriteria ?? [] as criterion, i}
          <div class="border border-slate-100 rounded-lg p-4">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div>
                <p class="font-medium text-text">{criterion.name}</p>
                {#if criterion.description}
                  <p class="text-sm text-text-muted mt-0.5">{criterion.description}</p>
                {/if}
              </div>
              <span class="text-xs text-text-muted shrink-0">max {criterion.maxScore} pts</span>
            </div>
            <div class="flex items-center gap-3 mb-3">
              <label class="text-sm text-text-muted">Score:</label>
              <input
                type="number"
                min="0"
                max={criterion.maxScore}
                value={rubricScores[criterion.id]?.score ?? 0}
                oninput={(e) => {
                  rubricScores[criterion.id] = {
                    score: Math.min(
                      criterion.maxScore,
                      Math.max(0, parseInt((e.target as HTMLInputElement).value, 10) || 0)
                    ),
                    comment: rubricScores[criterion.id]?.comment ?? ''
                  };
                }}
                class="w-20 text-sm border border-slate-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span class="text-sm text-text-muted">/ {criterion.maxScore}</span>
            </div>
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">
                Comment <span class="text-text-muted/70">(optional)</span>
              </label>
              <textarea
                rows="2"
                value={rubricScores[criterion.id]?.comment ?? ''}
                oninput={(e) => {
                  rubricScores[criterion.id] = {
                    score: rubricScores[criterion.id]?.score ?? 0,
                    comment: (e.target as HTMLTextAreaElement).value
                  };
                }}
                placeholder="Add a comment for this criterion..."
                class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              ></textarea>
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Pass/Fail -->
    {#if exam?.examType === 'PASS_FAIL'}
      <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
        <h2 class="text-lg font-semibold text-text mb-4">Result</h2>
        <div class="flex gap-3">
          <button
            type="button"
            onclick={() => (passed = true)}
            class="px-6 py-3 rounded-lg font-medium text-sm transition-colors {passed === true
              ? 'bg-green-600 text-white'
              : 'bg-green-50 text-green-700 hover:bg-green-100'}"
          >
            ✓ Pass
          </button>
          <button
            type="button"
            onclick={() => (passed = false)}
            class="px-6 py-3 rounded-lg font-medium text-sm transition-colors {passed === false
              ? 'bg-red-600 text-white'
              : 'bg-red-50 text-red-700 hover:bg-red-100'}"
          >
            ✗ Fail
          </button>
        </div>
      </div>
    {/if}

    <!-- Total Score Summary -->
    {#if exam?.examType !== 'PASS_FAIL'}
      <div class="bg-primary/5 rounded-xl border border-primary/10 px-6 py-4 mb-6 flex items-center justify-between">
        <span class="font-medium text-text">Total Score</span>
        <span class="text-xl font-bold text-primary">{totalScore()}</span>
      </div>
    {/if}

    <!-- Teacher Notes -->
    <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
      <label for="teacherNotes" class="block text-sm font-medium text-text mb-2">
        Teacher Notes <span class="text-text-muted">(optional)</span>
      </label>
      <textarea
        id="teacherNotes"
        name="teacherNotes"
        rows="4"
        placeholder="Add feedback or notes for the student..."
        class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
      >{submission?.teacherNotes ?? ''}</textarea>
    </div>

    <div class="flex gap-3">
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Grade'}
      </Button>
      <a
        href="/teacher/exams/{exam?.id}"
        class="inline-flex items-center text-sm text-text-muted hover:text-text px-4 py-2"
      >Cancel</a>
    </div>
  </form>
</div>
