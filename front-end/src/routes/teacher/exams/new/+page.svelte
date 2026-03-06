<script lang="ts">
  import { enhance } from '$app/forms';
  import { Alert, Input, Button } from '$lib/components/ui';

  let { data, form } = $props();

  let submitting = $state(false);
  let examType = $state('score_based');

  // Questions for score_based / multiple_choice
  interface Question {
    questionText: string;
    questionType: string;
    options: string[];
    correctAnswer: string;
    points: number;
    position: number;
  }

  let questions = $state<Question[]>([]);

  function addQuestion() {
    questions = [
      ...questions,
      {
        questionText: '',
        questionType: examType === 'multiple_choice' ? 'multiple_choice' : 'open_ended',
        options: examType === 'multiple_choice' ? ['', ''] : [],
        correctAnswer: '',
        points: 1,
        position: questions.length + 1
      }
    ];
  }

  function removeQuestion(i: number) {
    questions = questions.filter((_, idx) => idx !== i).map((q, idx) => ({ ...q, position: idx + 1 }));
  }

  function addOption(qi: number) {
    questions = questions.map((q, idx) =>
      idx === qi ? { ...q, options: [...q.options, ''] } : q
    );
  }

  function removeOption(qi: number, oi: number) {
    questions = questions.map((q, idx) =>
      idx === qi ? { ...q, options: q.options.filter((_, i) => i !== oi) } : q
    );
  }

  function updateOption(qi: number, oi: number, val: string) {
    questions = questions.map((q, idx) =>
      idx === qi
        ? { ...q, options: q.options.map((o, i) => (i === oi ? val : o)) }
        : q
    );
  }

  // Rubric criteria for rubric_based
  interface Criterion {
    name: string;
    description: string;
    maxScore: number;
    position: number;
  }

  let rubricCriteria = $state<Criterion[]>([]);

  function addCriterion() {
    rubricCriteria = [
      ...rubricCriteria,
      { name: '', description: '', maxScore: 10, position: rubricCriteria.length + 1 }
    ];
  }

  function removeCriterion(i: number) {
    rubricCriteria = rubricCriteria
      .filter((_, idx) => idx !== i)
      .map((c, idx) => ({ ...c, position: idx + 1 }));
  }

  // When exam type changes, reset dynamic sections
  function handleTypeChange(val: string) {
    examType = val;
    questions = [];
    rubricCriteria = [];
  }

  const questionsJson = $derived(JSON.stringify(questions));
  const criteriaJson = $derived(JSON.stringify(rubricCriteria));
</script>

<svelte:head>
  <title>Create Exam — GrewMe</title>
</svelte:head>

<div class="max-w-2xl">
  <!-- Breadcrumb -->
  <nav class="text-sm text-text-muted mb-4">
    <a href="/teacher/exams" class="hover:text-primary">Exams</a>
    <span class="mx-2">›</span>
    <span class="text-text">New Exam</span>
  </nav>

  <h1 class="text-2xl font-bold text-text mb-6">Create Exam</h1>

  {#if form?.error}
    <div class="mb-4">
      <Alert variant="error">{form.error}</Alert>
    </div>
  {/if}

  <form
    method="POST"
    action="?/create"
    use:enhance={() => {
      submitting = true;
      return async ({ update }) => {
        submitting = false;
        await update();
      };
    }}
  >
    <!-- Hidden JSON fields -->
    {#if examType === 'score_based' || examType === 'multiple_choice'}
      <input type="hidden" name="questions" value={questionsJson} />
    {/if}
    {#if examType === 'rubric_based'}
      <input type="hidden" name="rubricCriteria" value={criteriaJson} />
    {/if}

    <div class="bg-surface rounded-xl border border-slate-100 p-6 space-y-5 mb-6">
      <div>
        <label for="title" class="block text-sm font-medium text-text mb-1">Title</label>
        <Input id="title" name="title" placeholder="e.g. Chapter 3 Quiz" required />
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-text mb-1">
          Description <span class="text-text-muted">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows="3"
          placeholder="Brief description..."
          class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        ></textarea>
      </div>

      <div>
        <label for="examType" class="block text-sm font-medium text-text mb-1">Exam Type</label>
        <select
          id="examType"
          name="examType"
          value={examType}
          onchange={(e) => handleTypeChange((e.target as HTMLSelectElement).value)}
          class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="score_based">Score Based</option>
          <option value="multiple_choice">Multiple Choice</option>
          <option value="rubric_based">Rubric Based</option>
          <option value="pass_fail">Pass/Fail</option>
        </select>
      </div>

      <div>
        <label for="topicId" class="block text-sm font-medium text-text mb-1">Topic</label>
        <select
          id="topicId"
          name="topicId"
          required
          class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Select a topic…</option>
          {#each data.subjects as subject}
            <optgroup label={subject.name}>
              {#each subject.topics as topic}
                <option value={topic.id}>{topic.name}</option>
              {/each}
            </optgroup>
          {/each}
        </select>
      </div>

      {#if examType === 'score_based'}
        <div>
          <label for="maxScore" class="block text-sm font-medium text-text mb-1">Max Score</label>
          <Input id="maxScore" name="maxScore" type="number" min="0" placeholder="100" />
        </div>
      {/if}

      <div>
        <label for="durationMinutes" class="block text-sm font-medium text-text mb-1">
          Duration (minutes) <span class="text-text-muted">(optional)</span>
        </label>
        <Input id="durationMinutes" name="durationMinutes" type="number" min="1" placeholder="60" />
      </div>
    </div>

    <!-- Dynamic sections -->
    {#if examType === 'multiple_choice' || examType === 'score_based'}
      <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-text">Questions</h2>
          <Button type="button" variant="ghost" onclick={addQuestion}>+ Add Question</Button>
        </div>
        {#if questions.length === 0}
          <p class="text-sm text-text-muted">No questions added yet.</p>
        {/if}
        {#each questions as question, qi}
          <div class="border border-slate-100 rounded-lg p-4 mb-4 space-y-3">
            <div class="flex items-start justify-between gap-2">
              <span class="text-sm font-medium text-text">Question {qi + 1}</span>
              <button
                type="button"
                onclick={() => removeQuestion(qi)}
                class="text-xs text-red-500 hover:text-red-700"
              >Remove</button>
            </div>
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">Question Text</label>
              <textarea
                rows="2"
                value={question.questionText}
                oninput={(e) => { questions[qi].questionText = (e.target as HTMLTextAreaElement).value; }}
                placeholder="Enter question..."
                class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              ></textarea>
            </div>
            {#if examType === 'multiple_choice'}
              <div>
                <label class="block text-xs font-medium text-text-muted mb-2">Options</label>
                {#each question.options as opt, oi}
                  <div class="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={opt}
                      oninput={(e) => updateOption(qi, oi, (e.target as HTMLInputElement).value)}
                      placeholder="Option {String.fromCharCode(65 + oi)}"
                      class="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    {#if question.options.length > 2}
                      <button
                        type="button"
                        onclick={() => removeOption(qi, oi)}
                        class="text-xs text-red-500 hover:text-red-700 px-2"
                      >✕</button>
                    {/if}
                  </div>
                {/each}
                <button
                  type="button"
                  onclick={() => addOption(qi)}
                  class="text-xs text-primary hover:underline"
                >+ Add option</button>
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1">Correct Answer</label>
                <select
                  value={question.correctAnswer}
                  onchange={(e) => { questions[qi].correctAnswer = (e.target as HTMLSelectElement).value; }}
                  class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select correct answer…</option>
                  {#each question.options as opt, oi}
                    {#if opt}
                      <option value={opt}>{String.fromCharCode(65 + oi)}. {opt}</option>
                    {/if}
                  {/each}
                </select>
              </div>
            {/if}
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">Points</label>
              <input
                type="number"
                min="0"
                value={question.points}
                oninput={(e) => { questions[qi].points = parseInt((e.target as HTMLInputElement).value, 10) || 0; }}
                class="w-24 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        {/each}
      </div>
    {/if}

    {#if examType === 'rubric_based'}
      <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-text">Rubric Criteria</h2>
          <Button type="button" variant="ghost" onclick={addCriterion}>+ Add Criterion</Button>
        </div>
        {#if rubricCriteria.length === 0}
          <p class="text-sm text-text-muted">No criteria added yet.</p>
        {/if}
        {#each rubricCriteria as criterion, ci}
          <div class="border border-slate-100 rounded-lg p-4 mb-4 space-y-3">
            <div class="flex items-start justify-between gap-2">
              <span class="text-sm font-medium text-text">Criterion {ci + 1}</span>
              <button
                type="button"
                onclick={() => removeCriterion(ci)}
                class="text-xs text-red-500 hover:text-red-700"
              >Remove</button>
            </div>
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">Name</label>
              <input
                type="text"
                value={criterion.name}
                oninput={(e) => { rubricCriteria[ci].name = (e.target as HTMLInputElement).value; }}
                placeholder="e.g. Clarity"
                class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">
                Description <span class="text-text-muted/70">(optional)</span>
              </label>
              <textarea
                rows="2"
                value={criterion.description}
                oninput={(e) => { rubricCriteria[ci].description = (e.target as HTMLTextAreaElement).value; }}
                placeholder="Describe the criterion..."
                class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              ></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">Max Score</label>
              <input
                type="number"
                min="0"
                value={criterion.maxScore}
                oninput={(e) => { rubricCriteria[ci].maxScore = parseInt((e.target as HTMLInputElement).value, 10) || 0; }}
                class="w-24 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <div class="flex gap-3">
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create Exam'}
      </Button>
      <a
        href="/teacher/exams"
        class="inline-flex items-center text-sm text-text-muted hover:text-text px-4 py-2"
      >Cancel</a>
    </div>
  </form>
</div>
