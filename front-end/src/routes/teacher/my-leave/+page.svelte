<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  import { enhance } from '$app/forms';
  import { formatDate } from '$lib/utils/helpers';

  let { data, form } = $props();

  // ── State ──────────────────────────────────────────────────────────────────
  let filter = $state<'all' | 'pending' | 'approved' | 'rejected'>('all');
  let showForm = $state(false);
  let isSubmitting = $state(false);
  let successMessage = $state('');
  let errorMessage = $state('');

  // ── Form state ─────────────────────────────────────────────────────────────
  let requestType = $state('ANNUAL');
  let startDate = $state('');
  let endDate = $state('');
  let reason = $state('');
  let isHalfDay = $state(false);
  let halfDaySession = $state('');

  // ── Derived filtered list ──────────────────────────────────────────────────
  const filteredRequests = $derived.by(() => {
    const requests = data.leaveRequests ?? [];
    if (filter === 'all') return requests;
    return requests.filter((lr: any) => lr.status?.toLowerCase() === filter);
  });

  // ── Status badge styling ───────────────────────────────────────────────────
  function getStatusBadgeClass(status: string) {
    const statusLower = status?.toLowerCase() ?? '';
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (statusLower === 'approved') return 'bg-green-100 text-green-800';
    if (statusLower === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }

  // ── Leave type badge styling ───────────────────────────────────────────────
  function getLeaveTypeBadgeClass(type: string) {
    const typeLower = type?.toLowerCase() ?? '';
    if (typeLower === 'sick') return 'bg-orange-100 text-orange-800';
    if (typeLower === 'personal') return 'bg-blue-100 text-blue-800';
    if (typeLower === 'annual') return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  }

  // ── Get status label ───────────────────────────────────────────────────────
  function getStatusLabel(status: string) {
    const statusLower = status?.toLowerCase() ?? '';
    if (statusLower === 'pending') return m.leave_status_pending?.() ?? 'Pending';
    if (statusLower === 'approved') return m.leave_status_approved?.() ?? 'Approved';
    if (statusLower === 'rejected') return m.leave_status_rejected?.() ?? 'Rejected';
    return status;
  }

  // ── Get leave type label ───────────────────────────────────────────────────
  function getLeaveTypeLabel(type: string) {
    const typeLower = type?.toLowerCase() ?? '';
    if (typeLower === 'sick') return m.teacher_leave_type_sick?.() ?? 'Sick Leave';
    if (typeLower === 'personal') return m.teacher_leave_type_personal?.() ?? 'Personal Leave';
    if (typeLower === 'annual') return m.teacher_leave_type_annual?.() ?? 'Annual Leave';
    return type;
  }

  // ── Clear messages after delay ─────────────────────────────────────────────
  function clearMessages() {
    setTimeout(() => {
      successMessage = '';
      errorMessage = '';
    }, 4000);
  }

  // ── Handle form submission ─────────────────────────────────────────────────
  $effect(() => {
    if (form?.success) {
      successMessage = m.teacher_leave_request_created?.() ?? 'Leave request created successfully';
      requestType = 'ANNUAL';
      startDate = '';
      endDate = '';
      reason = '';
      isHalfDay = false;
      halfDaySession = '';
      showForm = false;
      clearMessages();
    } else if (form?.error) {
      errorMessage = form.error;
      clearMessages();
    }
  });

  // ── Handle delete success ──────────────────────────────────────────────────
  $effect(() => {
    if (form?.deleted) {
      successMessage = m.teacher_leave_request_deleted?.() ?? 'Leave request deleted successfully';
      clearMessages();
    }
  });
</script>

<div class="min-h-screen bg-background p-6">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-text mb-2">
        {m.teacher_leave_title?.() ?? 'My Leave'}
      </h1>
      <p class="text-text-muted">
        {m.teacher_leave_subtitle?.() ?? 'View your leave balance and manage leave requests'}
      </p>
    </div>

    <!-- Success/Error Alerts -->
    {#if successMessage}
      <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
        {successMessage}
      </div>
    {/if}
    {#if errorMessage}
      <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
        {errorMessage}
      </div>
    {/if}

    <!-- Balance Cards -->
    {#if data.balance}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <!-- Annual Leave Card -->
        <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-6">
          <p class="text-sm text-text-muted mb-2">
            {m.teacher_leave_annual_balance?.() ?? 'Annual Leave'}
          </p>
          <div class="flex items-baseline gap-2 mb-4">
            <span class="text-3xl font-bold text-primary">
              {data.balance.remainingAnnual ?? 0}
            </span>
            <span class="text-text-muted">
              {m.teacher_leave_of_max?.({ max: data.balance.maxAnnualLeave ?? 0 }) ??
                `of ${data.balance.maxAnnualLeave ?? 0}`}
            </span>
          </div>
          <p class="text-xs text-text-muted">
            {m.teacher_leave_used?.({ count: (data.balance.usedAnnual ?? 0) + (data.balance.usedPersonal ?? 0) }) ??
              `${(data.balance.usedAnnual ?? 0) + (data.balance.usedPersonal ?? 0)} used`}
          </p>
        </div>

        <!-- Sick Leave Card -->
        <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-6">
          <p class="text-sm text-text-muted mb-2">
            {m.teacher_leave_sick_balance?.() ?? 'Sick Leave'}
          </p>
          <div class="flex items-baseline gap-2 mb-4">
            <span class="text-3xl font-bold text-orange-600">
              {data.balance.remainingSick ?? 0}
            </span>
            <span class="text-text-muted">
              {m.teacher_leave_of_max?.({ max: data.balance.maxSickLeave ?? 0 }) ??
                `of ${data.balance.maxSickLeave ?? 0}`}
            </span>
          </div>
          <p class="text-xs text-text-muted">
            {m.teacher_leave_used?.({ count: data.balance.usedSick ?? 0 }) ??
              `${data.balance.usedSick ?? 0} used`}
          </p>
        </div>

        <!-- Personal Leave Card -->
        <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-6">
          <p class="text-sm text-text-muted mb-2">
            {m.teacher_leave_personal_used?.() ?? 'Personal Leave Used'}
          </p>
          <div class="flex items-baseline gap-2 mb-4">
            <span class="text-3xl font-bold text-blue-600">
              {data.balance.usedPersonal ?? 0}
            </span>
            <span class="text-text-muted">
              {m.teacher_leave_of_max?.({ max: data.balance.maxAnnualLeave ?? 0 }) ??
                `of ${data.balance.maxAnnualLeave ?? 0}`}
            </span>
          </div>
          <p class="text-xs text-text-muted">
            {m.teacher_leave_remaining?.({ count: (data.balance.maxAnnualLeave ?? 0) - (data.balance.usedAnnual ?? 0) - (data.balance.usedPersonal ?? 0) }) ??
              `${(data.balance.maxAnnualLeave ?? 0) - (data.balance.usedAnnual ?? 0) - (data.balance.usedPersonal ?? 0)} remaining`}
          </p>
        </div>
      </div>
    {/if}

    <!-- Submit Form (Collapsible) -->
    <div class="mb-8">
      <button
        onclick={() => (showForm = !showForm)}
        class="w-full px-6 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors flex items-center justify-between"
      >
        <span>
          {m.teacher_leave_submit_title?.() ?? 'Submit New Leave Request'}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 transition-transform {showForm ? 'rotate-180' : ''}"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {#if showForm}
        <div class="mt-4 bg-surface rounded-xl shadow-sm border border-slate-100 p-6">
          <form
            method="POST"
            action="?/create"
            use:enhance={() => {
              isSubmitting = true;
              return async ({ result, update }) => {
                isSubmitting = false;
                if (result.type === 'success') {
                  await update();
                } else if (result.type === 'failure') {
                  // Error is handled by $effect
                }
              };
            }}
            class="space-y-4"
          >
            <!-- Leave Type -->
            <div>
              <label for="requestType" class="block text-sm font-medium text-text mb-2">
                {m.teacher_leave_type_label?.() ?? 'Leave Type'}
              </label>
              <select
                id="requestType"
                name="requestType"
                bind:value={requestType}
                class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background text-text"
              >
                <option value="ANNUAL">{m.teacher_leave_type_annual?.() ?? 'Annual Leave'}</option>
                <option value="SICK">{m.teacher_leave_type_sick?.() ?? 'Sick Leave'}</option>
                <option value="PERSONAL">{m.teacher_leave_type_personal?.() ?? 'Personal Leave'}</option>
              </select>
            </div>

            <!-- Half Day Toggle -->
            <div>
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  bind:checked={isHalfDay}
                  onchange={() => {
                    if (!isHalfDay) halfDaySession = '';
                    if (isHalfDay && startDate) endDate = startDate;
                  }}
                  class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                />
                <span class="text-sm font-medium text-text">Half Day Leave</span>
              </label>
            </div>

            <!-- Half Day Session (AM/PM) -->
            {#if isHalfDay}
              <div class="flex gap-3">
                <button
                  type="button"
                  onclick={() => (halfDaySession = 'MORNING')}
                  class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors {halfDaySession === 'MORNING'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-text hover:bg-slate-200'}"
                >
                  Morning (AM)
                </button>
                <button
                  type="button"
                  onclick={() => (halfDaySession = 'AFTERNOON')}
                  class="flex-1 px-4 py-2 rounded-lg font-medium transition-colors {halfDaySession === 'AFTERNOON'
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 text-text hover:bg-slate-200'}"
                >
                  Afternoon (PM)
                </button>
              </div>
              <input type="hidden" name="halfDaySession" value={halfDaySession} />
            {/if}

            <!-- Start Date -->
            <div>
              <label for="startDate" class="block text-sm font-medium text-text mb-2">
                {m.teacher_leave_start_date?.() ?? 'Start Date'}
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                bind:value={startDate}
                onchange={() => {
                  if (isHalfDay) endDate = startDate;
                }}
                required
                class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background text-text"
              />
            </div>

            <!-- End Date -->
            {#if !isHalfDay}
              <div>
                <label for="endDate" class="block text-sm font-medium text-text mb-2">
                  {m.teacher_leave_end_date?.() ?? 'End Date'}
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  bind:value={endDate}
                  required
                  class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background text-text"
                />
              </div>
            {/if}

            <!-- Reason -->
            <div>
              <label for="reason" class="block text-sm font-medium text-text mb-2">
                {m.teacher_leave_reason?.() ?? 'Reason'}
              </label>
              <textarea
                id="reason"
                name="reason"
                bind:value={reason}
                placeholder={m.teacher_leave_reason_placeholder?.() ?? 'Provide a reason for your leave request...'}
                required
                rows="4"
                class="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background text-text resize-none"
              ></textarea>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                class="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {isSubmitting
                  ? m.teacher_leave_submitting?.() ?? 'Submitting...'
                  : m.teacher_leave_submit_btn?.() ?? 'Submit Request'}
              </button>
              <button
                type="button"
                onclick={() => {
                  showForm = false;
                  requestType = 'ANNUAL';
                  startDate = '';
                  endDate = '';
                  reason = '';
                  isHalfDay = false;
                  halfDaySession = '';
                }}
                class="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-text font-medium rounded-lg transition-colors"
              >
                {m.common_cancel?.() ?? 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      {/if}
    </div>

    <!-- Filter Tabs -->
    <div class="mb-6 flex gap-2 flex-wrap">
      <button
        onclick={() => (filter = 'all')}
        class="px-4 py-2 rounded-lg font-medium transition-colors {filter === 'all'
          ? 'bg-primary text-white'
          : 'bg-surface text-text border border-slate-200 hover:bg-slate-50'}"
      >
        {m.leave_filter_all?.() ?? 'All'}
      </button>
      <button
        onclick={() => (filter = 'pending')}
        class="px-4 py-2 rounded-lg font-medium transition-colors {filter === 'pending'
          ? 'bg-primary text-white'
          : 'bg-surface text-text border border-slate-200 hover:bg-slate-50'}"
      >
        {m.leave_filter_pending?.() ?? 'Pending'}
      </button>
      <button
        onclick={() => (filter = 'approved')}
        class="px-4 py-2 rounded-lg font-medium transition-colors {filter === 'approved'
          ? 'bg-primary text-white'
          : 'bg-surface text-text border border-slate-200 hover:bg-slate-50'}"
      >
        {m.leave_filter_approved?.() ?? 'Approved'}
      </button>
      <button
        onclick={() => (filter = 'rejected')}
        class="px-4 py-2 rounded-lg font-medium transition-colors {filter === 'rejected'
          ? 'bg-primary text-white'
          : 'bg-surface text-text border border-slate-200 hover:bg-slate-50'}"
      >
        {m.leave_filter_rejected?.() ?? 'Rejected'}
      </button>
    </div>

    <!-- Leave Requests List -->
    {#if filteredRequests.length === 0}
      <div class="text-center py-16">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16 text-gray-300 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p class="text-text-muted text-lg">
          {m.teacher_leave_no_requests?.() ?? 'No leave requests found'}
        </p>
      </div>
    {:else}
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 font-medium text-text-muted">Type</th>
                <th class="px-4 py-3 font-medium text-text-muted">Date</th>
                <th class="px-4 py-3 font-medium text-text-muted">Days</th>
                <th class="px-4 py-3 font-medium text-text-muted">Reason</th>
                <th class="px-4 py-3 font-medium text-text-muted">Status</th>
                <th class="px-4 py-3 font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each filteredRequests as leaveRequest (leaveRequest.id)}
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium {getLeaveTypeBadgeClass(leaveRequest.requestType)}">
                      {getLeaveTypeLabel(leaveRequest.requestType)}
                    </span>
                    {#if leaveRequest.halfDaySession}
                      <span class="ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
                        {leaveRequest.halfDaySession === 'morning' ? 'AM' : 'PM'}
                      </span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-text whitespace-nowrap">
                    {#if leaveRequest.halfDaySession || leaveRequest.startDate === leaveRequest.endDate}
                      {formatDate(leaveRequest.startDate)}
                    {:else}
                      {formatDate(leaveRequest.startDate)} – {formatDate(leaveRequest.endDate)}
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-text">
                    <span>{leaveRequest.daysCount ?? 0}</span>
                    {#if leaveRequest.halfDaySession}
                      <span class="block text-[10px] text-indigo-600 font-medium">
                        Half Day ({leaveRequest.halfDaySession === 'morning' ? 'AM' : 'PM'})
                      </span>
                    {:else}
                      <span class="block text-[10px] text-text-muted">Full Day</span>
                    {/if}
                  </td>
                  <td class="px-4 py-3 text-text max-w-[200px] truncate" title={leaveRequest.reason ?? ''}>
                    {leaveRequest.reason ?? '—'}
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium {getStatusBadgeClass(leaveRequest.status)}">
                      {getStatusLabel(leaveRequest.status)}
                    </span>
                    {#if leaveRequest.status?.toLowerCase() !== 'pending'}
                      <p class="text-[10px] text-text-muted mt-1">
                        {leaveRequest.reviewedBy?.name ?? ''} • {formatDate(leaveRequest.reviewedAt)}
                      </p>
                      {#if leaveRequest.rejectionReason}
                        <p class="text-[10px] text-red-600 mt-0.5">{leaveRequest.rejectionReason}</p>
                      {/if}
                    {/if}
                  </td>
                  <td class="px-4 py-3">
                    {#if leaveRequest.status?.toLowerCase() === 'pending'}
                      <form
                        method="POST"
                        action="?/delete"
                        use:enhance={() => {
                          return async ({ result, update }) => {
                            if (result.type === 'success') {
                              await update();
                            }
                          };
                        }}
                      >
                        <input type="hidden" name="teacherLeaveRequestId" value={leaveRequest.id} />
                        <button
                          type="submit"
                          onclick={(e) => {
                            if (!confirm(m.teacher_leave_delete_confirm?.() ?? 'Are you sure you want to delete this request?')) {
                              e.preventDefault();
                            }
                          }}
                          class="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors"
                        >
                          {m.common_delete?.() ?? 'Delete'}
                        </button>
                      </form>
                    {:else}
                      <span class="text-text-muted text-xs">—</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
</div>
