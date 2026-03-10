<script lang="ts">
  import { enhance } from '$app/forms';
  import { Alert, Input, Button } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data, form } = $props();

  let submitting = $state(false);
  let examType = $state('SCORE_BASED');

  // Local mirror of the QuestionTemplate shape (avoids PageData generation lag)
  interface QTemplate {
    id: string;
    name: string;
    category: string;
    gradeMin: number;
    gradeMax: number;
    templateText: string;
    variables: Array<{ name: string; min: number; max: number }>;
    formula: string;
  }

  // Questions for SCORE_BASED / MULTIPLE_CHOICE
  interface Question {
    questionText: string;
    questionType: string;
    options: string[];
    correctAnswer: string;
    points: number;
    position: number;
    parameterized: boolean;
    templateText: string;
    variables: Array<{ name: string; min: number; max: number }>;
    formula: string;
    valueMode: string;
    fixedValues: Record<string, number>;
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
        position: questions.length + 1,
        parameterized: false,
        templateText: '',
        variables: [],
        formula: '',
        valueMode: 'shuffled',
        fixedValues: {}
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

  // ── Parameterized helpers ──────────────────────────────────────────────────

  // Use type cast because PageData may not have regenerated yet after server changes
  const templates: QTemplate[] = $derived(
    ((data as Record<string, unknown>).questionTemplates as QTemplate[] | undefined) ?? []
  );

  /** Templates grouped by category for the select optgroup */
  const templatesByCategory = $derived(
    templates.reduce<Record<string, QTemplate[]>>((acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    }, {})
  );

  function toggleParameterized(qi: number, on: boolean) {
    questions = questions.map((q, idx) =>
      idx === qi ? { ...q, parameterized: on } : q
    );
  }

  function selectTemplate(qi: number, templateId: string) {
    if (templateId === 'custom') return;
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;
    questions = questions.map((q, idx) =>
      idx === qi
        ? {
            ...q,
            templateText: tmpl.templateText,
            variables: tmpl.variables.map((v) => ({ ...v })),
            formula: tmpl.formula
          }
        : q
    );
  }

  function addVariable(qi: number) {
    questions = questions.map((q, idx) =>
      idx === qi
        ? { ...q, variables: [...q.variables, { name: '', min: 1, max: 10 }] }
        : q
    );
  }

  function removeVariable(qi: number, vi: number) {
    questions = questions.map((q, idx) =>
      idx === qi
        ? { ...q, variables: q.variables.filter((_, i) => i !== vi) }
        : q
    );
  }

  function updateVariable(
    qi: number,
    vi: number,
    field: 'name' | 'min' | 'max',
    val: string
  ) {
    questions = questions.map((q, idx) => {
      if (idx !== qi) return q;
      const vars = q.variables.map((v, i) => {
        if (i !== vi) return v;
        if (field === 'name') return { ...v, name: val };
        return { ...v, [field]: parseFloat(val) || 0 };
      });
      return { ...q, variables: vars };
    });
  }

  function updateFixedValue(qi: number, varName: string, val: string) {
    questions = questions.map((q, idx) =>
      idx === qi
        ? { ...q, fixedValues: { ...q.fixedValues, [varName]: parseFloat(val) || 0 } }
        : q
    );
  }

  /** Render template text replacing {varName} with sample values */
  function renderPreview(question: Question): string {
    if (!question.templateText) return 'No template text set yet.';
    let text = question.templateText;
    for (const v of question.variables) {
      if (v.name) {
        const sampleVal =
          question.valueMode === 'fixed'
            ? (question.fixedValues[v.name] ?? v.min)
            : v.min;
        text = text.replaceAll(`{${v.name}}`, String(sampleVal));
      }
    }
    return text;
  }

  const templateTextPlaceholder = 'e.g. What is {a} + {b}?';

  // ── Rubric criteria ────────────────────────────────────────────────────────

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
            <!-- Question header -->
            <div class="flex items-start justify-between gap-2">
              <span class="text-sm font-medium text-text">Question {qi + 1}</span>
              <button
                type="button"
                onclick={() => removeQuestion(qi)}
                class="text-xs text-red-500 hover:text-red-700"
              >{m.exam_remove()}</button>
            </div>

            <!-- Parameterized toggle -->
            <label class="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={question.parameterized}
                onchange={(e) => toggleParameterized(qi, (e.target as HTMLInputElement).checked)}
                class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30"
              />
              <span class="text-xs font-medium text-text-muted">Parameterized question</span>
              <span class="text-xs text-text-muted/60 italic">(generates unique values per student)</span>
            </label>

            {#if !question.parameterized}
              <!-- ── Normal question UI ─────────────────────────────────── -->
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

            {:else}
              <!-- ── Parameterized question UI ──────────────────────────── -->

              <!-- Template picker -->
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1">Template</label>
                <select
                  onchange={(e) => selectTemplate(qi, (e.target as HTMLSelectElement).value)}
                  class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="custom">— Custom template —</option>
                  {#each Object.entries(templatesByCategory) as [category, catTemplates]}
                    <optgroup label={category}>
                      {#each catTemplates as tmpl}
                        <option value={tmpl.id}>{tmpl.name}</option>
                      {/each}
                    </optgroup>
                  {/each}
                </select>
              </div>

              <!-- Template text -->
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1">
                  Template text
                  <span class="font-normal text-text-muted/60 ml-1">— use {'{varName}'} syntax for variables</span>
                </label>
                <textarea
                  rows="2"
                  value={question.templateText}
                  oninput={(e) => { questions[qi].templateText = (e.target as HTMLTextAreaElement).value; }}
                  placeholder={templateTextPlaceholder}
                  class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono"
                ></textarea>
              </div>

              <!-- Variable range editors -->
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-xs font-medium text-text-muted">Variables</label>
                  <button
                    type="button"
                    onclick={() => addVariable(qi)}
                    class="text-xs text-primary hover:underline"
                  >+ Add variable</button>
                </div>
                {#if question.variables.length === 0}
                  <p class="text-xs text-text-muted/60 italic">No variables yet. Add one or select a template above.</p>
                {/if}
                {#each question.variables as v, vi}
                  <div class="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={v.name}
                      oninput={(e) => updateVariable(qi, vi, 'name', (e.target as HTMLInputElement).value)}
                      placeholder="name"
                      class="w-20 text-sm border border-slate-200 rounded-lg px-2 py-1.5 font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span class="text-xs text-text-muted">min</span>
                    <input
                      type="number"
                      value={v.min}
                      oninput={(e) => updateVariable(qi, vi, 'min', (e.target as HTMLInputElement).value)}
                      class="w-20 text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span class="text-xs text-text-muted">max</span>
                    <input
                      type="number"
                      value={v.max}
                      oninput={(e) => updateVariable(qi, vi, 'max', (e.target as HTMLInputElement).value)}
                      class="w-20 text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      onclick={() => removeVariable(qi, vi)}
                      class="text-xs text-red-400 hover:text-red-600 px-1"
                    >✕</button>
                  </div>
                {/each}
              </div>

              <!-- Formula -->
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1">
                  Formula
                  <span class="font-normal text-text-muted/60 ml-1">— expression to compute the correct answer</span>
                </label>
                <input
                  type="text"
                  value={question.formula}
                  oninput={(e) => { questions[qi].formula = (e.target as HTMLInputElement).value; }}
                  placeholder="e.g. a + b"
                  class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <!-- Value mode -->
              <div>
                <label class="block text-xs font-medium text-text-muted mb-1">Value mode</label>
                <div class="flex gap-4">
                  <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs text-text">
                    <input
                      type="radio"
                      name={"valueMode_" + qi}
                      value="shuffled"
                      checked={question.valueMode === 'shuffled'}
                      onchange={() => { questions[qi].valueMode = 'shuffled'; }}
                      class="text-primary focus:ring-primary/30"
                    />
                    Unique per student
                  </label>
                  <label class="inline-flex items-center gap-1.5 cursor-pointer text-xs text-text">
                    <input
                      type="radio"
                      name={"valueMode_" + qi}
                      value="fixed"
                      checked={question.valueMode === 'fixed'}
                      onchange={() => { questions[qi].valueMode = 'fixed'; }}
                      class="text-primary focus:ring-primary/30"
                    />
                    Same for all students
                  </label>
                </div>
              </div>

              <!-- Fixed values (only when mode = fixed) -->
              {#if question.valueMode === 'fixed' && question.variables.length > 0}
                <div class="bg-slate-50 rounded-lg p-3 space-y-2">
                  <p class="text-xs font-medium text-text-muted">Fixed values</p>
                  {#each question.variables as v}
                    {#if v.name}
                      <div class="flex items-center gap-3">
                        <span class="text-xs font-mono text-text w-20">{v.name}</span>
                        <input
                          type="number"
                          value={question.fixedValues[v.name] ?? v.min}
                          oninput={(e) => updateFixedValue(qi, v.name, (e.target as HTMLInputElement).value)}
                          min={v.min}
                          max={v.max}
                          class="w-24 text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <span class="text-xs text-text-muted/60">{v.min}–{v.max}</span>
                      </div>
                    {/if}
                  {/each}
                </div>
              {/if}

              <!-- Live preview -->
              {#if question.templateText}
                <div class="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p class="text-xs font-medium text-blue-600 mb-1">Preview</p>
                  <p class="text-sm text-blue-900">{renderPreview(question)}</p>
                  {#if question.formula}
                    <p class="text-xs text-blue-500 mt-1.5">
                      Answer formula: <code class="font-mono">{question.formula}</code>
                    </p>
                  {/if}
                </div>
              {/if}

            {/if}

            <!-- Points (always shown) -->
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
