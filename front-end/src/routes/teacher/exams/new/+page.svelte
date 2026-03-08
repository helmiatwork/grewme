<script lang="ts">
  import { enhance } from '$app/forms';
  import { Alert, Input, Button } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data, form } = $props();

  let submitting = $state(false);
  let examType = $state('SCORE_BASED');

  // Questions for SCORE_BASED / MULTIPLE_CHOICE
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
        questionType: examType === 'MULTIPLE_CHOICE' ? 'multiple_choice' : 'open_ended',
        options: examType === 'MULTIPLE_CHOICE' ? ['', ''] : [],
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

  // Rubric criteria for RUBRIC
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
  <title>{m.exam_new_header()} — {m.app_name()}</title>
</svelte:head>

<div class="max-w-2xl">
  <!-- Breadcrumb -->
  <nav class="text-sm text-text-muted mb-4">
    <a href="/teacher/exams" class="hover:text-primary">Exams</a>
    <span class="mx-2">›</span>
    <span class="text-text">{m.exam_new_title()}</span>
  </nav>

  <h1 class="text-2xl font-bold text-text mb-6">{m.exam_new_header()}</h1>

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
    {#if examType === 'SCORE_BASED' || examType === 'MULTIPLE_CHOICE'}
      <input type="hidden" name="questions" value={questionsJson} />
    {/if}
    {#if examType === 'RUBRIC'}
      <input type="hidden" name="rubricCriteria" value={criteriaJson} />
    {/if}

    <div class="bg-surface rounded-xl border border-slate-100 p-6 space-y-5 mb-6">
      <div>
        <label for="title" class="block text-sm font-medium text-text mb-1">{m.exam_field_title()}</label>
        <Input id="title" name="title" placeholder={m.exam_field_title_placeholder()} required />
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-text mb-1">
          {m.exam_field_description_optional()}
        </label>
        <textarea
          id="description"
          name="description"
          rows="3"
          placeholder={m.curriculum_description_placeholder()}
          class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
        ></textarea>
      </div>

      <div>
        <label for="examType" class="block text-sm font-medium text-text mb-1">{m.exam_field_exam_type()}</label>
        <select
          id="examType"
          name="examType"
          value={examType}
          onchange={(e) => handleTypeChange((e.target as HTMLSelectElement).value)}
          class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="SCORE_BASED">{m.exam_type_score_based()}</option>
          <option value="MULTIPLE_CHOICE">{m.exam_type_multiple_choice()}</option>
          <option value="RUBRIC">{m.exam_type_rubric()}</option>
          <option value="PASS_FAIL">{m.exam_type_pass_fail()}</option>
        </select>
      </div>

      <div>
        <label for="topicId" class="block text-sm font-medium text-text mb-1">{m.exam_field_topic()}</label>
        <select
          id="topicId"
          name="topicId"
          required
          class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">{m.exam_field_select_topic()}</option>
          {#each data.subjects as subject}
            <optgroup label={subject.name}>
              {#each subject.topics as topic}
                <option value={topic.id}>{topic.name}</option>
              {/each}
            </optgroup>
          {/each}
        </select>
      </div>

      {#if examType === 'SCORE_BASED'}
        <div>
          <label for="maxScore" class="block text-sm font-medium text-text mb-1">{m.exam_field_max_score()}</label>
          <Input id="maxScore" name="maxScore" type="number" min="0" placeholder="100" />
        </div>
      {/if}

      <div>
        <label for="durationMinutes" class="block text-sm font-medium text-text mb-1">
          {m.exam_field_duration_optional()}
        </label>
        <Input id="durationMinutes" name="durationMinutes" type="number" min="1" placeholder="60" />
      </div>
    </div>

    <!-- Dynamic sections -->
    {#if examType === 'MULTIPLE_CHOICE' || examType === 'SCORE_BASED'}
      <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-text">{m.exam_questions_section()}</h2>
          <Button type="button" variant="ghost" onclick={addQuestion}>{m.exam_add_question()}</Button>
        </div>
        {#if questions.length === 0}
          <p class="text-sm text-text-muted">{m.exam_no_questions()}</p>
        {/if}
        {#each questions as question, qi}
          <div class="border border-slate-100 rounded-lg p-4 mb-4 space-y-3">
            <div class="flex items-start justify-between gap-2">
              <span class="text-sm font-medium text-text">Question {qi + 1}</span>
              <button
                type="button"
                onclick={() => removeQuestion(qi)}
                class="text-xs text-red-500 hover:text-red-700"
              >{m.exam_remove()}</button>
            </div>
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">{m.exam_question_text_label()}</label>
              <textarea
                rows="2"
                value={question.questionText}
                oninput={(e) => { questions[qi].questionText = (e.target as HTMLTextAreaElement).value; }}
                placeholder={m.exam_question_text_placeholder()}
                class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              ></textarea>
            </div>
            {#if examType === 'MULTIPLE_CHOICE'}
              <div>
                <label class="block text-xs font-medium text-text-muted mb-2">{m.exam_options_label()}</label>
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
                >{m.exam_add_option()}</button>
              </div>
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1">{m.exam_correct_answer()}</label>
                <select
                  value={question.correctAnswer}
                  onchange={(e) => { questions[qi].correctAnswer = (e.target as HTMLSelectElement).value; }}
                  class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">{m.exam_select_correct()}</option>
                  {#each question.options as opt, oi}
                    {#if opt}
                      <option value={opt}>{String.fromCharCode(65 + oi)}. {opt}</option>
                    {/if}
                  {/each}
                </select>
              </div>
            {/if}
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">{m.exam_points_label()}</label>
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

    {#if examType === 'RUBRIC'}
      <div class="bg-surface rounded-xl border border-slate-100 p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-text">{m.exam_rubric_section()}</h2>
          <Button type="button" variant="ghost" onclick={addCriterion}>{m.exam_add_criterion()}</Button>
        </div>
        {#if rubricCriteria.length === 0}
          <p class="text-sm text-text-muted">{m.exam_no_criteria()}</p>
        {/if}
        {#each rubricCriteria as criterion, ci}
          <div class="border border-slate-100 rounded-lg p-4 mb-4 space-y-3">
            <div class="flex items-start justify-between gap-2">
              <span class="text-sm font-medium text-text">Criterion {ci + 1}</span>
              <button
                type="button"
                onclick={() => removeCriterion(ci)}
                class="text-xs text-red-500 hover:text-red-700"
              >{m.exam_remove()}</button>
            </div>
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">{m.exam_criterion_name()}</label>
              <input
                type="text"
                value={criterion.name}
                oninput={(e) => { rubricCriteria[ci].name = (e.target as HTMLInputElement).value; }}
                placeholder="e.g. Clarity"
                class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">{m.exam_criterion_desc_optional()}</label>
              <textarea
                rows="2"
                value={criterion.description}
                oninput={(e) => { rubricCriteria[ci].description = (e.target as HTMLTextAreaElement).value; }}
                placeholder={m.exam_criterion_desc_placeholder()}
                class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              ></textarea>
            </div>
            <div>
              <label class="block text-xs font-medium text-text-muted mb-1">{m.exam_field_max_score()}</label>
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
        {submitting ? m.exam_creating() : m.exam_create_btn()}
      </Button>
      <a
        href="/teacher/exams"
        class="inline-flex items-center text-sm text-text-muted hover:text-text px-4 py-2"
      >{m.common_cancel()}</a>
    </div>
  </form>
</div>
