<script lang="ts">
  import * as m from '$lib/paraglide/messages.js';
  import { enhance } from '$app/forms';
  import { formatDate } from '$lib/utils/helpers';

  let { data }: { data: any } = $props();

  // ── State ──────────────────────────────────────────────────────────────────
  let filter = $state<'all' | 'pending' | 'approved' | 'rejected'>('all');
  let successMessage = $state('');
  let errorMessage = $state('');
  let showRejectionReason = $state<Record<string, boolean>>({});
  let showSubstituteDropdown = $state<Record<string, boolean>>({});

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
    if (typeLower === 'sick') return m.leave_type_sick?.() ?? 'Sick Leave';
    if (typeLower === 'personal') return m.teacher_leave_type_personal?.() ?? 'Personal Leave';
    if (typeLower === 'annual') return m.teacher_leave_type_annual?.() ?? 'Annual Leave';
    return type;
  }

  // ── Get available substitute teachers (exclude requesting teacher) ─────────
  function getAvailableSubstitutes(teacherId: string) {
    return (data.teachers ?? []).filter((t: any) => t.id !== teacherId);
  }

  // ── Clear messages after delay ─────────────────────────────────────────────
  function clearMessages() {
    setTimeout(() => {
      successMessage = '';
      errorMessage = '';
    }, 4000);
  }
</script>

<div class="min-h-screen bg-background p-6">
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-text mb-2">
        {m.school_teacher_leave_title?.() ?? 'Teacher Leave Requests'}
      </h1>
      <p class="text-text-muted">
        {m.school_teacher_leave_subtitle?.() ?? 'Review and manage teacher leave requests'}
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
          {m.leave_no_requests?.() ?? 'No leave requests found'}
        </p>
      </div>
    {:else}
      <div class="space-y-4">
        {#each filteredRequests as leaveRequest (leaveRequest.id)}
          <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-6">
            <!-- Header: Teacher Name & Badges -->
            <div class="flex items-start justify-between mb-4">
              <div>
                <p class="text-lg font-semibold text-text">
                  {leaveRequest.teacher?.name ?? 'Unknown Teacher'}
                </p>
              </div>
              <div class="flex gap-2">
                <!-- Leave Type Badge -->
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium {getLeaveTypeBadgeClass(
                    leaveRequest.requestType
                  )}"
                >
                  {getLeaveTypeLabel(leaveRequest.requestType)}
                </span>
                <!-- Status Badge -->
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-medium {getStatusBadgeClass(
                    leaveRequest.status
                  )}"
                >
                  {getStatusLabel(leaveRequest.status)}
                </span>
              </div>
            </div>

            <!-- Date Range & Days Count -->
            <div class="mb-4 p-3 bg-slate-50 rounded-lg">
              <p class="text-sm text-text-muted mb-1">
                {m.leave_date_range?.() ?? 'Date Range'}
              </p>
              <p class="text-sm font-medium text-text">
                {formatDate(leaveRequest.startDate)} – {formatDate(leaveRequest.endDate)}
              </p>
              <p class="text-xs text-text-muted mt-1">
                {m.leave_days?.({ count: leaveRequest.daysCount ?? 0 }) ??
                  `${leaveRequest.daysCount ?? 0} days`}
              </p>
            </div>

            <!-- Reason -->
            <div class="mb-4">
              <p class="text-sm text-text-muted mb-1">{m.leave_reason_label?.() ?? 'Reason'}</p>
              <p class="text-sm text-text">{leaveRequest.reason ?? '—'}</p>
            </div>

            <!-- Substitute Teacher Info (if assigned) -->
            {#if leaveRequest.substitute}
              <div class="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p class="text-xs text-text-muted mb-1">
                  {m.school_teacher_leave_substitute?.() ?? 'Substitute Teacher'}
                </p>
                <p class="text-sm font-medium text-text">
                  {leaveRequest.substitute.name}
                </p>
              </div>
            {/if}

            <!-- Review Info (if reviewed) -->
            {#if leaveRequest.status?.toLowerCase() !== 'pending'}
              <div class="mb-4 p-3 bg-slate-50 rounded-lg">
                <p class="text-xs text-text-muted mb-1">
                  {m.leave_reviewed_by?.() ?? 'Reviewed by'}
                </p>
                <p class="text-sm font-medium text-text">
                  {leaveRequest.reviewedBy?.name ?? 'Unknown'} •
                  {formatDate(leaveRequest.reviewedAt)}
                </p>
                {#if leaveRequest.rejectionReason}
                  <p class="text-xs text-text-muted mt-2 mb-1">
                    {m.leave_rejection_reason?.() ?? 'Rejection Reason'}
                  </p>
                  <p class="text-sm text-red-700">{leaveRequest.rejectionReason}</p>
                {/if}
              </div>
            {/if}

            <!-- Action Buttons (if pending) -->
            {#if leaveRequest.status?.toLowerCase() === 'pending'}
              <div class="space-y-3">
                <!-- Substitute Teacher Selection -->
                {#if showSubstituteDropdown[leaveRequest.id]}
                  <div class="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <label for="substitute-{leaveRequest.id}" class="block text-xs font-medium text-text mb-2">
                      {m.school_teacher_leave_select_substitute?.() ?? 'Select Substitute Teacher'}
                    </label>
                    <select
                      id="substitute-{leaveRequest.id}"
                      class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-surface text-text"
                    >
                      <option value="">
                        {m.school_teacher_leave_no_substitute?.() ?? 'No substitute'}
                      </option>
                      {#each getAvailableSubstitutes(leaveRequest.teacher?.id) as teacher}
                        <option value={teacher.id}>{teacher.name}</option>
                      {/each}
                    </select>
                  </div>
                {/if}

                <!-- Rejection Reason Input -->
                {#if showRejectionReason[leaveRequest.id]}
                  <div class="p-3 bg-red-50 rounded-lg border border-red-100">
                    <label for="reason-{leaveRequest.id}" class="block text-xs font-medium text-text mb-2">
                      {m.leave_rejection_reason?.() ?? 'Rejection Reason'}
                    </label>
                    <textarea
                      id="reason-{leaveRequest.id}"
                      placeholder={m.leave_rejection_placeholder?.() ?? 'Explain why this request is rejected...'}
                      class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none bg-surface text-text"
                      rows="3"
                    ></textarea>
                  </div>
                {/if}

                <!-- Approve/Reject Buttons -->
                <div class="flex gap-3">
                  <form
                    method="POST"
                    action="?/review"
                    use:enhance={() => {
                      return async ({ result, update }) => {
                        if (result.type === 'success') {
                          successMessage = (result.data as any)?.success ?? 'Leave request approved';
                          clearMessages();
                          await update();
                        } else if (result.type === 'failure') {
                          errorMessage = (result.data as any)?.error ?? 'Failed to approve request';
                          clearMessages();
                        }
                      };
                    }}
                    class="flex-1"
                  >
                    <input type="hidden" name="teacherLeaveRequestId" value={leaveRequest.id} />
                    <input type="hidden" name="decision" value="APPROVED" />
                    {#if showSubstituteDropdown[leaveRequest.id]}
                      <input
                        type="hidden"
                        name="substituteId"
                        value={document.querySelector(`#substitute-${leaveRequest.id}`)?.value ?? ''}
                      />
                    {/if}
                    <button
                      type="submit"
                      class="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                    >
                      {m.leave_approve?.() ?? 'Approve'}
                    </button>
                  </form>

                  <button
                    type="button"
                    onclick={() => {
                      showSubstituteDropdown[leaveRequest.id] = !showSubstituteDropdown[leaveRequest.id];
                    }}
                    class="flex-1 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-colors"
                  >
                    {showSubstituteDropdown[leaveRequest.id]
                      ? m.common_cancel?.() ?? 'Cancel'
                      : m.school_teacher_leave_select_substitute?.() ?? 'Select Substitute'}
                  </button>

                  <button
                    type="button"
                    onclick={() => {
                      showRejectionReason[leaveRequest.id] = !showRejectionReason[leaveRequest.id];
                    }}
                    class="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors"
                  >
                    {showRejectionReason[leaveRequest.id]
                      ? m.common_cancel?.() ?? 'Cancel'
                      : m.leave_reject?.() ?? 'Reject'}
                  </button>
                </div>

                <!-- Reject Form (shown when textarea is visible) -->
                {#if showRejectionReason[leaveRequest.id]}
                  <form
                    method="POST"
                    action="?/review"
                    use:enhance={() => {
                      return async ({ result, update }) => {
                        if (result.type === 'success') {
                          successMessage = (result.data as any)?.success ?? 'Leave request rejected';
                          clearMessages();
                          await update();
                        } else if (result.type === 'failure') {
                          errorMessage = (result.data as any)?.error ?? 'Failed to reject request';
                          clearMessages();
                        }
                      };
                    }}
                  >
                    <input type="hidden" name="teacherLeaveRequestId" value={leaveRequest.id} />
                    <input type="hidden" name="decision" value="REJECTED" />
                    <textarea
                      name="rejectionReason"
                      placeholder={m.leave_rejection_placeholder?.() ?? 'Explain why this request is rejected...'}
                      class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none bg-surface text-text"
                      rows="3"
                      required
                    ></textarea>
                    <button
                      type="submit"
                      class="w-full mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                      {m.leave_confirm_reject?.() ?? 'Confirm Rejection'}
                    </button>
                  </form>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
