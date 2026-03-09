<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  let { data } = $props();

  // Compute summary stats
  const totalDays = $derived(data.records?.length ?? 0);
  const presentCount = $derived(data.records?.filter((r: any) => r.status === 'present').length ?? 0);
  const attendanceRate = $derived(totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0);
  const absenceCount = $derived(
    (data.records?.filter((r: any) => ['sick', 'excused', 'unexcused'].includes(r.status)).length ?? 0)
  );

  // Status badge styling
  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      present: 'bg-green-100 text-green-800',
      sick: 'bg-orange-100 text-orange-800',
      excused: 'bg-blue-100 text-blue-800',
      unexcused: 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-slate-100 text-slate-800';
  };

  // Get status label
  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, () => string> = {
      present: () => m.attendance_status_present(),
      sick: () => m.attendance_status_sick(),
      excused: () => m.attendance_status_excused(),
      unexcused: () => m.attendance_status_unexcused()
    };
    return statusMap[status]?.() || status;
  };
</script>

<svelte:head>
  <title>Attendance History — GrewMe</title>
</svelte:head>

<div class="max-w-4xl mx-auto py-8 px-4">
  <h1 class="text-2xl font-bold text-text mb-6">{m.attendance_history_title()}</h1>

  {#if data.error}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{data.error}</div>
  {/if}

  {#if data.records?.length > 0}
    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">{m.attendance_summary_total_days()}</p>
        <p class="text-2xl font-bold text-text mt-1">{totalDays}</p>
      </div>
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">{m.attendance_summary_rate()}</p>
        <p class="text-2xl font-bold text-text mt-1">{attendanceRate}<span class="text-sm font-normal text-text-muted">%</span></p>
      </div>
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-4 text-center">
        <p class="text-xs text-text-muted uppercase tracking-wide">Absences</p>
        <p class="text-2xl font-bold text-text mt-1">{absenceCount}</p>
      </div>
    </div>

    <!-- History Table -->
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="px-6 py-4 border-b border-slate-100">
        <h2 class="text-lg font-semibold text-text">Attendance Records</h2>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-text-muted">{m.attendance_date_label()}</th>
              <th class="px-4 py-3 text-left font-medium text-text-muted">Status</th>
              <th class="px-4 py-3 text-left font-medium text-text-muted">{m.attendance_classroom_label()}</th>
              <th class="px-4 py-3 text-left font-medium text-text-muted">Notes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each data.records as record}
              <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 text-text">{new Date(record.date).toLocaleDateString()}</td>
                <td class="px-4 py-3">
                  <span class="inline-block px-3 py-1 rounded-full text-xs font-medium {getStatusBadgeClass(record.status)}">
                    {getStatusLabel(record.status)}
                  </span>
                </td>
                <td class="px-4 py-3 text-text">{record.classroom?.name ?? '—'}</td>
                <td class="px-4 py-3 text-text-muted text-xs">{record.notes ?? '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {:else}
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 px-6 py-12 text-center">
      <p class="text-text-muted">{m.attendance_no_records()}</p>
    </div>
  {/if}
</div>
