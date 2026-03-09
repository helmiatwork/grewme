<script lang="ts">
  import { enhance } from '$app/forms';
  import * as m from '$lib/paraglide/messages.js';

  let { data, form } = $props();

  // ── State ──────────────────────────────────────────────────────────────────
  let selectedDate = $state(new Date().toISOString().split('T')[0]);
  let selectedClassroomId = $state('');
  let loadingAttendance = $state(false);
  let savingAttendance = $state(false);
  let successMessage = $state('');
  let errorMessage = $state('');

  // ── Attendance records state ───────────────────────────────────────────────
  let attendanceRecords = $state<Array<{
    studentId: string;
    studentName: string;
    status: string;
    notes: string;
  }>>([]);

  // ── Track local changes ────────────────────────────────────────────────────
  let recordChanges = $state(new Map<string, { status: string; notes: string }>());

  // ── Derived state ─────────────────────────────────────────────────────────
  const hasRecords = $derived(attendanceRecords.length > 0);
  const selectedClassroom = $derived(
    data.classrooms?.find((c: any) => c.id === selectedClassroomId)
  );

  // ── Handle form results ────────────────────────────────────────────────────
  $effect(() => {
    if (form?.success) {
      successMessage = m.attendance_saved();
      errorMessage = '';
      setTimeout(() => {
        successMessage = '';
      }, 3000);
    } else if (form?.error) {
      errorMessage = form.error;
      successMessage = '';
    }

    // Load attendance records from form result
    if (form?.records) {
      attendanceRecords = form.records.map((r: any) => ({
        studentId: r.student.id,
        studentName: r.student.name,
        status: r.status || 'present',
        notes: r.notes || ''
      }));
      recordChanges.clear();
    }
  });

  // ── Load attendance handler ────────────────────────────────────────────────
  function handleLoadAttendance() {
    if (!selectedClassroomId || !selectedDate) {
      errorMessage = 'Please select both classroom and date';
      return;
    }
    loadingAttendance = true;
    errorMessage = '';
    successMessage = '';
  }

  // ── Mark all present ───────────────────────────────────────────────────────
  function markAllPresent() {
    attendanceRecords.forEach((record) => {
      recordChanges.set(record.studentId, {
        status: 'present',
        notes: recordChanges.get(record.studentId)?.notes || ''
      });
    });
  }

  // ── Update record status ───────────────────────────────────────────────────
  function updateStatus(studentId: string, status: string) {
    const current = recordChanges.get(studentId) || {
      status: attendanceRecords.find((r) => r.studentId === studentId)?.status || 'present',
      notes: attendanceRecords.find((r) => r.studentId === studentId)?.notes || ''
    };
    recordChanges.set(studentId, { ...current, status });
  }

  // ── Update record notes ────────────────────────────────────────────────────
  function updateNotes(studentId: string, notes: string) {
    const current = recordChanges.get(studentId) || {
      status: attendanceRecords.find((r) => r.studentId === studentId)?.status || 'present',
      notes: ''
    };
    recordChanges.set(studentId, { ...current, notes });
  }

  // ── Get current status for display ─────────────────────────────────────────
  function getStatus(studentId: string): string {
    return recordChanges.get(studentId)?.status || attendanceRecords.find((r) => r.studentId === studentId)?.status || 'present';
  }

  // ── Get current notes for display ──────────────────────────────────────────
  function getNotes(studentId: string): string {
    return recordChanges.get(studentId)?.notes || attendanceRecords.find((r) => r.studentId === studentId)?.notes || '';
  }

  // ── Serialize records for submission ────────────────────────────────────────
  function getSerializedRecords(): string {
    return JSON.stringify(
      attendanceRecords.map((record) => {
        const changes = recordChanges.get(record.studentId);
        return {
          studentId: record.studentId,
          status: changes?.status || record.status,
          notes: changes?.notes || record.notes
        };
      })
    );
  }
</script>

<svelte:head>
  <title>{m.attendance_title()} — {m.app_name()}</title>
</svelte:head>

<div class="max-w-6xl mx-auto py-8 px-4">
  <h1 class="text-2xl font-bold text-text mb-6">{m.attendance_title()}</h1>

  <!-- Error/Success Alerts -->
  {#if errorMessage}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
      {errorMessage}
    </div>
  {/if}

  {#if successMessage}
    <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
      {successMessage}
    </div>
  {/if}

  <!-- Load Attendance Form -->
  <form method="POST" action="?/loadAttendance" use:enhance={() => {
    loadingAttendance = true;
    return async ({ result }) => {
      loadingAttendance = false;
      if (result.type === 'success') {
        attendanceRecords = result.data.records.map((r: any) => ({
          studentId: r.student.id,
          studentName: r.student.name,
          status: r.status || 'present',
          notes: r.notes || ''
        }));
        recordChanges.clear();
      }
    };
  }}>
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Date Picker -->
        <div>
          <label for="date" class="block text-sm font-medium text-text mb-2">
            {m.attendance_date_label()}
          </label>
          <input
            type="date"
            id="date"
            name="date"
            bind:value={selectedDate}
            class="w-full px-3 py-2 border border-slate-300 rounded-lg text-text bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <!-- Classroom Selector -->
        <div>
          <label for="classroom" class="block text-sm font-medium text-text mb-2">
            {m.attendance_classroom_label()}
          </label>
          <select
            id="classroom"
            name="classroomId"
            bind:value={selectedClassroomId}
            class="w-full px-3 py-2 border border-slate-300 rounded-lg text-text bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{m.attendance_select_classroom()}</option>
            {#each data.classrooms as classroom}
              <option value={classroom.id}>{classroom.name}</option>
            {/each}
          </select>
        </div>

        <!-- Load Button -->
        <div class="flex items-end">
          <button
            type="submit"
            disabled={loadingAttendance || !selectedClassroomId || !selectedDate}
            class="w-full bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed px-4 py-2 font-medium transition"
          >
            {loadingAttendance ? m.attendance_saving() : 'Load'}
          </button>
        </div>
      </div>
    </div>
  </form>

  <!-- Attendance Records Table -->
  {#if hasRecords}
    <form method="POST" action="?/save" use:enhance={() => {
      savingAttendance = true;
      return async ({ result }) => {
        savingAttendance = false;
        if (result.type === 'success') {
          successMessage = m.attendance_saved();
          errorMessage = '';
          setTimeout(() => {
            successMessage = '';
          }, 3000);
        }
      };
    }}>
      <input type="hidden" name="classroomId" value={selectedClassroomId} />
      <input type="hidden" name="date" value={selectedDate} />
      <input type="hidden" name="records" value={getSerializedRecords()} />

      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-text">
            {selectedClassroom?.name || 'Students'}
          </h2>
          <button
            type="button"
            onclick={markAllPresent}
            class="text-sm bg-slate-100 text-text hover:bg-slate-200 rounded-lg px-3 py-1 transition"
          >
            {m.attendance_mark_all()}
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-text-muted">Student</th>
                <th class="px-4 py-3 text-left font-medium text-text-muted">Status</th>
                <th class="px-4 py-3 text-left font-medium text-text-muted">Notes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each attendanceRecords as record (record.studentId)}
                <tr class="hover:bg-slate-50">
                  <td class="px-4 py-3 text-text font-medium">{record.studentName}</td>
                  <td class="px-4 py-3">
                    <div class="flex gap-3">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status-{record.studentId}"
                          value="present"
                          checked={getStatus(record.studentId) === 'present'}
                          onchange={() => updateStatus(record.studentId, 'present')}
                          class="w-4 h-4"
                        />
                        <span class="text-text text-xs">{m.attendance_status_present()}</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status-{record.studentId}"
                          value="sick"
                          checked={getStatus(record.studentId) === 'sick'}
                          onchange={() => updateStatus(record.studentId, 'sick')}
                          class="w-4 h-4"
                        />
                        <span class="text-text text-xs">{m.attendance_status_sick()}</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status-{record.studentId}"
                          value="excused"
                          checked={getStatus(record.studentId) === 'excused'}
                          onchange={() => updateStatus(record.studentId, 'excused')}
                          class="w-4 h-4"
                        />
                        <span class="text-text text-xs">{m.attendance_status_excused()}</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="status-{record.studentId}"
                          value="unexcused"
                          checked={getStatus(record.studentId) === 'unexcused'}
                          onchange={() => updateStatus(record.studentId, 'unexcused')}
                          class="w-4 h-4"
                        />
                        <span class="text-text text-xs">{m.attendance_status_unexcused()}</span>
                      </label>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <input
                      type="text"
                      value={getNotes(record.studentId)}
                      onchange={(e) => updateNotes(record.studentId, (e.target as HTMLInputElement).value)}
                      placeholder="Add notes..."
                      class="w-full px-2 py-1 border border-slate-300 rounded text-text text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 justify-end">
        <button
          type="button"
          onclick={() => {
            attendanceRecords = [];
            recordChanges.clear();
            selectedClassroomId = '';
          }}
          class="bg-slate-100 text-text hover:bg-slate-200 rounded-lg px-4 py-2 font-medium transition"
        >
          {m.common_cancel()}
        </button>
        <button
          type="submit"
          disabled={savingAttendance}
          class="bg-primary text-white rounded-lg hover:bg-primary/90 disabled:bg-slate-300 disabled:cursor-not-allowed px-4 py-2 font-medium transition"
        >
          {savingAttendance ? m.attendance_saving() : m.attendance_save()}
        </button>
      </div>
    </form>
  {:else if selectedClassroomId && selectedDate && !loadingAttendance}
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 px-6 py-12 text-center">
      <p class="text-text-muted">{m.attendance_no_records()}</p>
    </div>
  {/if}
</div>
