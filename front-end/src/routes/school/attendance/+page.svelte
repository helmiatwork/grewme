<script lang="ts">
  import { enhance } from '$app/forms';
  import * as m from '$lib/paraglide/messages.js';

  let { data, form } = $props();

  let classroomId = $state('');
  let startDate = $state('');
  let endDate = $state('');
  let submitting = $state(false);

  const averageAttendanceRate = $derived.by(() => {
    if (!form?.summary || form.summary.length === 0) return 0;
    const total = form.summary.reduce((sum: number, s: any) => sum + (s.attendanceRate || 0), 0);
    return Math.round(total / form.summary.length);
  });

  const totalStudents = $derived(form?.summary?.length ?? 0);

  const chronicAbsenteeism = $derived.by(() => {
    if (!form?.summary) return new Set<string>();
    return new Set(
      form.summary
        .filter((s: any) => (s.attendanceRate || 0) < 75)
        .map((s: any) => s.studentId)
    );
  });

  function formatDateRange(start: string | undefined, end: string | undefined): string {
    if (!start || !end) return '';
    return `${new Date(start).toLocaleDateString()} – ${new Date(end).toLocaleDateString()}`;
  }

  function getAttendanceRateColor(rate: number): string {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-amber-600';
    return 'text-red-600';
  }

  function getAttendanceRateBg(rate: number): string {
    if (rate >= 90) return 'bg-green-50';
    if (rate >= 75) return 'bg-amber-50';
    return 'bg-red-50';
  }
</script>

<svelte:head>
  <title>{m.attendance_summary_title()} — {m.app_name()}</title>
</svelte:head>

<div class="max-w-6xl mx-auto py-8 px-4">
  <h1 class="text-2xl font-bold text-text mb-6">{m.attendance_summary_title()}</h1>

  <!-- Filters Form -->
  <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
    {#if form?.error}
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{form.error}</div>
    {/if}

    <form
      method="POST"
      action="?/loadSummary"
      use:enhance={() => {
        submitting = true;
        return async ({ update }) => {
          submitting = false;
          await update();
        };
      }}
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <div>
        <label for="classroomId" class="block text-sm font-medium text-text mb-1">
          {m.attendance_classroom_label()}
        </label>
        <select
          id="classroomId"
          name="classroomId"
          bind:value={classroomId}
          required
          disabled={submitting}
          class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">{m.attendance_select_classroom()}</option>
          {#each data.classrooms as classroom}
            <option value={classroom.id}>{classroom.name} (Grade {classroom.grade})</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="startDate" class="block text-sm font-medium text-text mb-1">Start Date</label>
        <input
          id="startDate"
          type="date"
          name="startDate"
          bind:value={startDate}
          required
          disabled={submitting}
          class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <label for="endDate" class="block text-sm font-medium text-text mb-1">End Date</label>
        <input
          id="endDate"
          type="date"
          name="endDate"
          bind:value={endDate}
          required
          disabled={submitting}
          class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div class="flex items-end">
        <button
          type="submit"
          disabled={submitting || !classroomId}
          class="w-full bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed px-4 py-2 font-medium transition"
        >
          {submitting ? m.attendance_saving() : 'Load Report'}
        </button>
      </div>
    </form>
  </div>

  <!-- Summary Stats -->
  {#if form?.summary && form.summary.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">{m.attendance_summary_rate()}</p>
        <p class="text-3xl font-bold text-primary mt-1">{averageAttendanceRate}<span class="text-sm font-normal text-text-muted">%</span></p>
      </div>
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">Students</p>
        <p class="text-3xl font-bold text-text mt-1">{totalStudents}</p>
      </div>
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">Period</p>
        <p class="text-sm font-semibold text-text mt-2">{formatDateRange(form.startDate, form.endDate)}</p>
      </div>
    </div>

    <!-- Attendance Table -->
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100">
              <th class="px-4 py-3 text-left font-semibold text-text">Student</th>
              <th class="px-4 py-3 text-center font-semibold text-text">{m.attendance_summary_total_days()}</th>
              <th class="px-4 py-3 text-center font-semibold text-green-600">{m.attendance_status_present()}</th>
              <th class="px-4 py-3 text-center font-semibold text-orange-600">{m.attendance_status_sick()}</th>
              <th class="px-4 py-3 text-center font-semibold text-blue-600">{m.attendance_status_excused()}</th>
              <th class="px-4 py-3 text-center font-semibold text-red-600">{m.attendance_status_unexcused()}</th>
              <th class="px-4 py-3 text-center font-semibold text-text">{m.attendance_summary_rate()}</th>
            </tr>
          </thead>
          <tbody>
            {#each form.summary as student (student.studentId)}
              <tr
                class="border-b border-slate-100 hover:bg-slate-50 transition-colors
                  {chronicAbsenteeism.has(student.studentId) ? 'bg-red-50/50' : ''}"
              >
                <td class="px-4 py-3 font-medium text-text">{student.studentName}</td>
                <td class="px-4 py-3 text-center text-text-muted">{student.totalDays}</td>
                <td class="px-4 py-3 text-center font-semibold text-green-600">{student.presentCount}</td>
                <td class="px-4 py-3 text-center font-semibold text-orange-600">{student.sickCount}</td>
                <td class="px-4 py-3 text-center font-semibold text-blue-600">{student.excusedCount}</td>
                <td class="px-4 py-3 text-center font-semibold text-red-600">{student.unexcusedCount}</td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-block px-2.5 py-1 rounded-full text-sm font-semibold {getAttendanceRateColor(student.attendanceRate)} {getAttendanceRateBg(student.attendanceRate)}"
                  >
                    {student.attendanceRate ?? 0}%
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Chronic Absenteeism Alert -->
    {#if chronicAbsenteeism.size > 0}
      <div class="mt-6 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg">
        <p class="font-semibold mb-1">{m.attendance_chronic_alert()}</p>
        <p class="text-sm">
          {chronicAbsenteeism.size} student{chronicAbsenteeism.size !== 1 ? 's' : ''} have attendance below 75%.
        </p>
      </div>
    {/if}
  {:else if form?.summary !== undefined}
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 px-6 py-12 text-center">
      <p class="text-text-muted">{m.attendance_no_records()}</p>
    </div>
  {/if}
</div>
