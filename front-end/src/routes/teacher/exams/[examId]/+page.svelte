<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Card, Alert, Button } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data, form } = $props();

  let activeTab = $state<'questions' | 'classrooms' | 'submissions'>('questions');
  let showAssignForm = $state(false);
  let assigning = $state(false);

  $effect(() => {
    if (form?.assignSuccess) {
      showAssignForm = false;
      invalidateAll();
    }
  });

  const exam = $derived(data.exam);

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

  const statusBadgeClass: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-600',
    ACTIVE: 'bg-green-100 text-green-700',
    CLOSED: 'bg-red-100 text-red-700'
  };

  const submissionStatusBadgeClass: Record<string, string> = {
    NOT_STARTED: 'bg-slate-100 text-slate-600',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
    SUBMITTED: 'bg-blue-100 text-blue-700',
    GRADED: 'bg-green-100 text-green-700'
  };

  function formatStatus(status: string) {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Classrooms already assigned
  const assignedClassroomIds = $derived(
    new Set(exam?.classroomExams?.map((ce: any) => ce.classroom.id) ?? [])
  );

  const unassignedClassrooms = $derived(
    data.classrooms.filter((c: any) => !assignedClassroomIds.has(c.id))
  );
</script>

<svelte:head>
  <title>{exam?.title ?? m.exam_title()} — {m.app_name()}</title>
</svelte:head>

<div>
  <!-- Breadcrumb -->
  <nav class="text-sm text-text-muted mb-4">
    <a href="/teacher/exams" class="hover:text-primary">Exams</a>
    <span class="mx-2">›</span>
    <span class="text-text">{exam?.title}</span>
  </nav>

  <!-- Header -->
  <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
    <div>
      <div class="flex items-center gap-3 mb-1">
        <h1 class="text-2xl font-bold text-text">{exam?.title}</h1>
        <span
          class="text-xs font-medium px-2 py-0.5 rounded-full {examTypeBadgeClass[exam?.examType] ?? 'bg-slate-100 text-slate-700'}"
        >
          {examTypeLabels[exam?.examType] ?? exam?.examType}
        </span>
      </div>
      {#if exam?.topic}
        <p class="text-sm text-text-muted">
          {exam.topic.subject?.name} › {exam.topic.name}
        </p>
      {/if}
    </div>
    <div class="flex flex-wrap gap-2 text-sm text-text-muted">
      {#if exam?.maxScore != null}
        <span class="bg-slate-100 px-3 py-1 rounded-full">{exam.maxScore} pts</span>
      {/if}
      {#if exam?.durationMinutes != null}
        <span class="bg-slate-100 px-3 py-1 rounded-full">{exam.durationMinutes} min</span>
      {/if}
    </div>
  </div>

  {#if exam?.description}
    <p class="text-text-muted text-sm mb-6">{exam.description}</p>
  {/if}

  <!-- Tabs -->
  <div class="flex gap-1 border-b border-slate-100 mb-6">
    {#each [['questions', m.exam_tab_questions()], ['classrooms', m.exam_tab_classrooms()], ['submissions', m.exam_tab_submissions()]] as [tab, label]}
      <button
        type="button"
        onclick={() => (activeTab = tab as any)}
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === tab
          ? 'border-primary text-primary'
          : 'border-transparent text-text-muted hover:text-text'}"
      >
        {label}
      </button>
    {/each}
  </div>

  <!-- Tab: Questions / Criteria -->
  {#if activeTab === 'questions'}
    {#if exam?.examType === 'RUBRIC'}
      {#if exam.rubricCriteria?.length === 0}
        <p class="text-sm text-text-muted">{m.exam_no_rubric()}</p>
      {:else}
        <div class="space-y-3">
          {#each exam.rubricCriteria as criterion, i}
            <div class="bg-surface rounded-xl border border-slate-100 p-4">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium text-text">{i + 1}. {criterion.name}</span>
                <span class="text-xs text-text-muted">{criterion.maxScore} pts</span>
              </div>
              {#if criterion.description}
                <p class="text-sm text-text-muted">{criterion.description}</p>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {:else if exam?.examType === 'PASS_FAIL'}
      <p class="text-sm text-text-muted">{m.exam_pass_fail_info()}</p>
    {:else}
      {#if exam?.examQuestions?.length === 0}
        <p class="text-sm text-text-muted">{m.exam_no_questions_added()}</p>
      {:else}
        <div class="space-y-3">
          {#each exam?.examQuestions ?? [] as question, i}
            <div class="bg-surface rounded-xl border border-slate-100 p-4">
              <div class="flex items-start justify-between gap-2 mb-2">
                <span class="font-medium text-text">{i + 1}. {question.questionText}</span>
                <span class="text-xs text-text-muted shrink-0">{question.points} pts</span>
              </div>
              {#if question.options?.length}
                <ul class="space-y-1 mt-2">
                  {#each question.options as opt, oi}
                    <li
                      class="text-sm px-3 py-1 rounded-lg {opt === question.correctAnswer
                        ? 'bg-green-50 text-green-700 font-medium'
                        : 'text-text-muted'}"
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                    </li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  {/if}

  <!-- Tab: Classrooms -->
  {#if activeTab === 'classrooms'}
    {#if form?.assignError}
      <div class="mb-4"><Alert variant="error">{form.assignError}</Alert></div>
    {/if}

    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-text">{m.exam_assigned_classrooms()}</h2>
      {#if unassignedClassrooms.length > 0}
        <Button variant="ghost" onclick={() => (showAssignForm = !showAssignForm)}>
          {showAssignForm ? m.common_cancel() : m.exam_assign_to_classroom()}
        </Button>
      {/if}
    </div>

    {#if showAssignForm}
      <div class="bg-surface rounded-xl border border-slate-100 p-4 mb-4">
        <form
          method="POST"
          action="?/assign"
          use:enhance={() => {
            assigning = true;
            return async ({ update }) => {
              assigning = false;
              await update();
            };
          }}
        >
          <input type="hidden" name="examId" value={exam?.id} />
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-text mb-1">{m.calendar_classroom_label()}</label>
              <select
                name="classroomId"
                required
                class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">{m.calendar_select_classroom()}</option>
                {#each unassignedClassrooms as classroom}
                  <option value={classroom.id}>{classroom.name}</option>
                {/each}
              </select>
            </div>
             <div class="grid grid-cols-2 gap-3">
               <div>
                 <label class="block text-sm font-medium text-text mb-1">
                   {m.exam_scheduled_at()}
                 </label>
                 <input
                   type="datetime-local"
                   name="scheduledAt"
                   class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                 />
               </div>
               <div>
                 <label class="block text-sm font-medium text-text mb-1">
                   {m.exam_due_at()}
                 </label>
                 <input
                   type="datetime-local"
                   name="dueAt"
                   class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                 />
               </div>
             </div>
             <div class="grid grid-cols-2 gap-3">
               <div>
                 <label class="block text-sm font-medium text-text mb-1">
                   Duration (minutes)
                 </label>
                 <input
                   type="number"
                   name="durationMinutes"
                   min="1"
                   class="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                 />
               </div>
               <div class="flex items-end">
                 <label class="flex items-center gap-2 cursor-pointer">
                   <input
                     type="checkbox"
                     name="showResults"
                     value="true"
                     class="w-4 h-4 border border-slate-200 rounded focus:ring-2 focus:ring-primary/30"
                   />
                   <span class="text-sm font-medium text-text">Show results to students</span>
                 </label>
               </div>
             </div>
            <Button type="submit" disabled={assigning}>
              {assigning ? m.exam_assigning() : m.exam_assign_btn()}
            </Button>
          </div>
        </form>
      </div>
    {/if}

    {#if exam?.classroomExams?.length === 0}
       <p class="text-sm text-text-muted">{m.exam_not_assigned()}</p>
     {:else}
       <div class="space-y-4">
         {#each exam?.classroomExams ?? [] as ce}
           <div class="bg-surface rounded-xl border border-slate-100 p-4">
             <div class="flex items-center justify-between mb-3">
               <div>
                 <p class="font-medium text-text">{ce.classroom.name}</p>
                 {#if ce.scheduledAt}
                   <p class="text-xs text-text-muted mt-0.5">
                     Scheduled: {new Date(ce.scheduledAt).toLocaleDateString()}
                   </p>
                 {/if}
               </div>
               <span
                 class="text-xs font-medium px-2 py-0.5 rounded-full {statusBadgeClass[ce.status] ?? 'bg-slate-100 text-slate-600'}"
               >
                 {ce.status}
               </span>
             </div>

             {#if ce.accessCode}
               <div class="bg-slate-50 rounded-lg p-3 border border-slate-200 mt-3">
                 <p class="text-xs text-text-muted font-medium mb-2">Access Code</p>
                 <div class="flex items-center gap-2 mb-3">
                   <code class="text-2xl font-mono font-bold text-primary tracking-wider">{ce.accessCode}</code>
                   <button
                     type="button"
                     onclick={() => {
                       navigator.clipboard.writeText(ce.accessCode);
                     }}
                     class="px-2 py-1 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                   >
                     Copy
                   </button>
                 </div>

                 <p class="text-xs text-text-muted font-medium mb-2">Exam URL</p>
                 <div class="flex items-center gap-2">
                   <code class="text-sm font-mono text-slate-600 break-all">/exam/{ce.accessCode}</code>
                   <button
                     type="button"
                     onclick={() => {
                       navigator.clipboard.writeText(`/exam/${ce.accessCode}`);
                     }}
                     class="px-2 py-1 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                   >
                     Copy
                   </button>
                 </div>
               </div>

               {#if ce.durationMinutes}
                 <p class="text-xs text-text-muted mt-3">
                   <span class="font-medium">Duration:</span> {ce.durationMinutes} minutes
                 </p>
               {/if}
               {#if ce.showResults}
                 <p class="text-xs text-text-muted mt-1">
                   <span class="font-medium">Results:</span> Visible to students
                 </p>
               {/if}
             {/if}
           </div>
         {/each}
       </div>
     {/if}
  {/if}

  <!-- Tab: Submissions -->
  {#if activeTab === 'submissions'}
    {#if exam?.classroomExams?.length === 0}
      <p class="text-sm text-text-muted">{m.exam_no_classrooms_assigned()}</p>
    {:else}
      {#each exam?.classroomExams ?? [] as ce}
        <div class="mb-6">
          <h3 class="font-semibold text-text mb-3">{ce.classroom.name}</h3>
          {#if ce.examSubmissions?.length === 0}
            <p class="text-sm text-text-muted ml-1">{m.exam_no_submissions()}</p>
          {:else}
            <div class="space-y-2">
              {#each ce.examSubmissions as sub}
                <a
                  href="/teacher/exams/{exam?.id}/grade/{sub.id}"
                  class="flex items-center justify-between bg-surface rounded-xl border border-slate-100 p-4 hover:border-primary/30 transition-colors"
                >
                  <div>
                    <p class="font-medium text-text">{sub.student.name}</p>
                    {#if sub.submittedAt}
                      <p class="text-xs text-text-muted mt-0.5">
                        Submitted: {new Date(sub.submittedAt).toLocaleDateString()}
                      </p>
                    {/if}
                  </div>
                  <div class="flex items-center gap-3">
                    {#if sub.score != null}
                      <span class="text-sm font-medium text-text">{sub.score} pts</span>
                    {/if}
                    <span
                      class="text-xs font-medium px-2 py-0.5 rounded-full {submissionStatusBadgeClass[sub.status] ?? 'bg-slate-100 text-slate-600'}"
                    >
                      {formatStatus(sub.status)}
                    </span>
                  </div>
                </a>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  {/if}
</div>
