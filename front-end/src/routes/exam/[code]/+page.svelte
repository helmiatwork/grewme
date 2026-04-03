<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as m from '$lib/paraglide/messages.js';
  import type { ExamAccessInfo } from '$lib/api/types';
  import {
    START_EXAM_MUTATION,
    SAVE_EXAM_PROGRESS_MUTATION,
    SUBMIT_EXAM_SESSION_MUTATION,
    EXAM_SESSION_QUERY
  } from '$lib/api/queries/exam';

  let { data } = $props();

  type ExamState = 'pick_student' | 'confirm' | 'taking' | 'submitted' | 'not_found';

  let examState: ExamState = $state(data.examAccess ? 'pick_student' : 'not_found');
  let selectedStudentId: string | null = $state(null);
  let sessionToken: string | null = $state(null);
  let answers: Record<string, string> = $state({});
  let timeRemaining: number | null = $state(null);
  let submissionResult: { status: string; score: number | null } | null = $state(null);
  let error = $state('');
  let saving = $state(false);
  let submitting = $state(false);
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

  const examAccess: ExamAccessInfo | null = data.examAccess;
  const students = $derived(
    (examAccess?.classroom.students ?? []).toSorted((a: any, b: any) =>
      a.firstName.localeCompare(b.firstName)
    )
  );
  const questions = $derived(examAccess?.exam.examQuestions ?? []);
  const answeredCount = $derived(Object.keys(answers).length);

  onMount(() => {
    const savedToken = typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(`exam-${data.code}`)
      : null;
    if (savedToken) tryRejoin(savedToken);
  });

  onDestroy(() => {
    if (timerInterval) clearInterval(timerInterval);
    if (autoSaveInterval) clearInterval(autoSaveInterval);
  });

  async function tryRejoin(token: string) {
    const res = await gql(EXAM_SESSION_QUERY, { sessionToken: token });
    const session = res.data?.examSession;
    if (session) {
      sessionToken = token;
      timeRemaining = session.timeRemaining;
      for (const a of session.examAnswers) {
        if (a.selectedAnswer) answers[a.examQuestion.id] = a.selectedAnswer;
      }
      examState = 'taking';
      startTimers();
    } else {
      sessionStorage.removeItem(`exam-${data.code}`);
    }
  }

  function selectStudent(studentId: string) {
    selectedStudentId = studentId;
    examState = 'confirm';
  }

  async function startExam() {
    error = '';
    const res = await gql(START_EXAM_MUTATION, {
      input: { accessCode: data.code, studentId: selectedStudentId }
    });
    const result = res.data?.startExam;
    if (result?.errors?.length) {
      error = result.errors[0].message;
      return;
    }

    sessionToken = result.examSubmission.sessionToken;
    timeRemaining = result.examSubmission.timeRemaining;
    sessionStorage.setItem(`exam-${data.code}`, sessionToken!);
    examState = 'taking';
    startTimers();
  }

  function startTimers() {
    if (timeRemaining !== null) {
      timerInterval = setInterval(() => {
        if (timeRemaining !== null) {
          timeRemaining = Math.max(0, timeRemaining - 1);
          if (timeRemaining === 0) submitExam();
        }
      }, 1000);
    }
    autoSaveInterval = setInterval(saveProgress, 30000);
  }

  async function saveProgress() {
    if (!sessionToken || saving) return;
    const answerList = Object.entries(answers).map(([qId, ans]) => ({
      examQuestionId: qId,
      selectedAnswer: ans
    }));
    if (answerList.length === 0) return;

    saving = true;
    await gql(SAVE_EXAM_PROGRESS_MUTATION, {
      input: { sessionToken, answers: answerList }
    });
    saving = false;
  }

  async function submitExam() {
    if (!sessionToken || submitting) return;
    submitting = true;

    await saveProgress();

    const res = await gql(SUBMIT_EXAM_SESSION_MUTATION, {
      input: { sessionToken }
    });
    const result = res.data?.submitExamSession;

    if (timerInterval) clearInterval(timerInterval);
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    sessionStorage.removeItem(`exam-${data.code}`);

    if (result?.examSubmission) {
      submissionResult = {
        status: result.examSubmission.status,
        score: result.examSubmission.score
      };
    }
    examState = 'submitted';
    submitting = false;
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  async function gql(query: string, variables: Record<string, unknown>) {
    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    return res.json();
  }

  const selectedStudent = $derived(students.find((s: any) => s.id === selectedStudentId));
</script>

{#if examState === 'not_found'}
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="text-center">
      <p class="text-6xl">😕</p>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">{m.exam_not_found_title()}</h1>
      <p class="mt-2 text-gray-500">{m.exam_not_found_body({ code: data.code })}</p>
      <a href="/exam" class="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
        {m.exam_not_found_try_again()}
      </a>
    </div>
  </div>

{:else if examState === 'pick_student'}
  <div class="mx-auto max-w-lg p-4 pt-12">
    <div class="mb-6 text-center">
      <h1 class="text-2xl font-bold text-gray-900">{examAccess?.exam.title}</h1>
      <p class="text-gray-500">{examAccess?.classroom.name}</p>
    </div>

    <p class="mb-4 text-center text-sm font-medium text-gray-700">{m.exam_pick_student_prompt()}</p>

    <div class="grid grid-cols-2 gap-3">
      {#each students as student}
        <button
          onclick={() => selectStudent(student.id)}
          class="rounded-xl border-2 border-gray-200 p-3 text-center transition hover:border-blue-400 hover:bg-blue-50"
        >
          <span class="font-medium">{student.firstName} {student.lastName}</span>
        </button>
      {/each}
    </div>
  </div>

{:else if examState === 'confirm'}
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-md text-center">
      <p class="text-5xl">📝</p>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">{examAccess?.exam.title}</h1>
      <p class="mt-1 text-gray-500">{m.exam_confirm_greeting({ name: selectedStudent?.firstName ?? '' })}</p>

      <div class="mt-6 rounded-xl bg-gray-50 p-4 text-left text-sm">
        <p><span class="font-medium">{m.exam_confirm_questions_label()}</span> {questions.length}</p>
        {#if examAccess?.durationMinutes}
          <p><span class="font-medium">{m.exam_confirm_time_limit_label()}</span> {m.exam_confirm_time_limit_value({ minutes: examAccess.durationMinutes })}</p>
        {:else}
          <p><span class="font-medium">{m.exam_confirm_time_limit_label()}</span> {m.exam_confirm_no_limit()}</p>
        {/if}
      </div>

      {#if error}
        <p class="mt-3 text-sm text-red-500">{error}</p>
      {/if}

      <button
        onclick={startExam}
        class="mt-6 w-full rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700"
      >
        {m.exam_confirm_start_btn()}
      </button>

      <button
        onclick={() => { examState = 'pick_student'; selectedStudentId = null; }}
        class="mt-2 text-sm text-gray-500 hover:text-gray-700"
      >
        {m.exam_confirm_wrong_name()}
      </button>
    </div>
  </div>

{:else if examState === 'taking'}
  <div class="mx-auto max-w-2xl p-4">
    <div class="sticky top-0 z-10 mb-6 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
      <div>
        <h1 class="font-bold text-gray-900">{examAccess?.exam.title}</h1>
        <p class="text-sm text-gray-500">{m.exam_taking_answered({ answered: answeredCount, total: questions.length })}</p>
      </div>
      <div class="flex items-center gap-3">
        {#if saving}
          <span class="text-xs text-gray-400">{m.exam_taking_saving()}</span>
        {/if}
        {#if timeRemaining !== null}
          <span
            class="rounded-lg px-3 py-1 font-mono text-lg font-bold {timeRemaining < 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}"
          >
            {formatTime(timeRemaining)}
          </span>
        {/if}
      </div>
    </div>

    {#each questions as question, i}
      <div class="mb-6 rounded-xl border border-gray-200 bg-white p-5">
        <p class="mb-3 font-medium text-gray-900">
          <span class="text-gray-400">{i + 1}.</span>
          {question.questionText}
        </p>

        {#if question.answerOptions}
          <div class="space-y-2">
            {#each question.answerOptions as option}
              <label
                class="flex cursor-pointer items-center rounded-lg border-2 p-3 transition {answers[question.id] === option ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}"
              >
                <input
                  type="radio"
                  name="q-{question.id}"
                  value={option}
                  checked={answers[question.id] === option}
                  onchange={() => { answers[question.id] = option; }}
                  class="sr-only"
                />
                <span class="text-sm">{option}</span>
              </label>
            {/each}
          </div>
        {:else}
          <textarea
            value={answers[question.id] ?? ''}
            oninput={(e: Event) => { answers[question.id] = (e.target as HTMLTextAreaElement).value; }}
            rows={3}
            class="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none"
            placeholder={m.exam_taking_answer_placeholder()}
          ></textarea>
        {/if}
      </div>
    {/each}

    <div class="sticky bottom-4 mt-4">
      <button
        onclick={() => submitExam()}
        disabled={submitting}
        class="w-full rounded-xl bg-green-600 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-green-700 disabled:opacity-50"
      >
        {submitting ? m.exam_taking_submitting() : m.exam_taking_submit_btn()}
      </button>
    </div>
  </div>

{:else if examState === 'submitted'}
  <div class="flex min-h-screen items-center justify-center p-4">
    <div class="w-full max-w-md text-center">
      <p class="text-6xl">🎉</p>
      <h1 class="mt-4 text-2xl font-bold text-gray-900">{m.exam_submitted_title()}</h1>

      {#if submissionResult?.score !== null && submissionResult?.score !== undefined && examAccess?.showResults}
        <div class="mt-6 rounded-xl bg-green-50 p-6">
          <p class="text-sm text-green-600">{m.exam_submitted_your_score()}</p>
          <p class="text-4xl font-bold text-green-700">{submissionResult.score}%</p>
        </div>
      {:else}
        <p class="mt-4 text-gray-500">{m.exam_submitted_review_msg()}</p>
      {/if}

      <p class="mt-8 text-sm text-gray-400">{m.exam_submitted_close_hint()}</p>
    </div>
  </div>
{/if}
