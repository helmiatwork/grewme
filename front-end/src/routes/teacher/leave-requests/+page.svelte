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
    if (typeLower === 'excused') return 'bg-blue-100 text-blue-800';
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
    if (typeLower === 'excused') return m.leave_type_excused?.() ?? 'Excused Absence';
    return type;
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
        {m.leave_requests_title?.() ?? 'Leave Requests'}
      </h1>
      <p class="text-text-muted">
        {m.leave_requests_subtitle?.() ?? 'Review and manage student leave requests'}
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
      <div class="bg-surface rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-left">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-4 py-3 font-medium text-text-muted">{m.nav_students?.() ?? 'Student'}</th>
                <th class="px-4 py-3 font-medium text-text-muted">{m.leave_parent_label?.() ?? 'Parent'}</th>
                <th class="px-4 py-3 font-medium text-text-muted">{m.leave_type_label?.() ?? 'Type'}</th>
                <th class="px-4 py-3 font-medium text-text-muted">{m.leave_date_range?.() ?? 'Date Range'}</th>
                <th class="px-4 py-3 font-medium text-text-muted">{m.leave_days?.({ count: 0 }) ?? 'Days'}</th>
                <th class="px-4 py-3 font-medium text-text-muted">{m.leave_reason_label?.() ?? 'Reason'}</th>
                <th class="px-4 py-3 font-medium text-text-muted">{m.common_status?.() ?? 'Status'}</th>
                <th class="px-4 py-3 font-medium text-text-muted">{m.common_actions?.() ?? 'Actions'}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {#each filteredRequests as leaveRequest (leaveRequest.id)}
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <!-- Student -->
                  <td class="px-4 py-3 text-text font-medium">
                    {leaveRequest.student?.name ?? 'Unknown Student'}
                  </td>

                  <!-- Parent -->
                  <td class="px-4 py-3 text-text">
                    {leaveRequest.parent?.name ?? 'Unknown'}
                  </td>

                  <!-- Type -->
                  <td class="px-4 py-3">
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-medium {getLeaveTypeBadgeClass(
                        leaveRequest.requestType
                      )}"
                    >
                      {getLeaveTypeLabel(leaveRequest.requestType)}
                    </span>
                  </td>

                  <!-- Date Range -->
                  <td class="px-4 py-3 text-text whitespace-nowrap">
                    {formatDate(leaveRequest.startDate)} – {formatDate(leaveRequest.endDate)}
                  </td>

                  <!-- Days -->
                  <td class="px-4 py-3 text-text text-center">
                    <span>{leaveRequest.daysCount ?? 0}</span>
                    <span class="block text-[10px] text-text-muted">Full Day</span>
                  </td>

                  <!-- Reason -->
                  <td class="px-4 py-3 text-text max-w-[200px] truncate" title={leaveRequest.reason ?? '—'}>
                    {leaveRequest.reason ?? '—'}
                  </td>

                  <!-- Status -->
                  <td class="px-4 py-3">
                    <div>
                      <span
                        class="px-2 py-0.5 rounded-full text-xs font-medium {getStatusBadgeClass(
                          leaveRequest.status
                        )}"
                      >
                        {getStatusLabel(leaveRequest.status)}
                      </span>
                      {#if leaveRequest.status?.toLowerCase() !== 'pending'}
                        <p class="text-xs text-text-muted mt-1">
                          {leaveRequest.reviewedBy?.name ?? 'Unknown'} • {formatDate(leaveRequest.reviewedAt)}
                        </p>
                      {/if}
                    </div>
                  </td>

                  <!-- Actions -->
                  <td class="px-4 py-3">
                    {#if leaveRequest.status?.toLowerCase() === 'pending'}
                      <div class="flex gap-2">
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
                        >
                          <input type="hidden" name="leaveRequestId" value={leaveRequest.id} />
                          <input type="hidden" name="decision" value="APPROVED" />
                          <button
                            type="submit"
                            class="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white font-medium rounded transition-colors"
                          >
                            {m.leave_approve_button?.() ?? 'Approve'}
                          </button>
                        </form>

                        <button
                          type="button"
                          onclick={() => {
                            showRejectionReason[leaveRequest.id] = !showRejectionReason[leaveRequest.id];
                          }}
                          class="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded transition-colors"
                        >
                          {showRejectionReason[leaveRequest.id]
                            ? m.leave_cancel_reject?.() ?? 'Cancel'
                            : m.leave_reject_button?.() ?? 'Reject'}
                        </button>
                      </div>
                    {/if}
                  </td>
                </tr>

                <!-- Rejection Form Expanded Row -->
                {#if leaveRequest.status?.toLowerCase() === 'pending' && showRejectionReason[leaveRequest.id]}
                  <tr class="bg-red-50/50">
                    <td colspan="8" class="px-4 py-3">
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
                        <input type="hidden" name="leaveRequestId" value={leaveRequest.id} />
                        <input type="hidden" name="decision" value="REJECTED" />
                        <div class="space-y-2">
                          <label for="reason-{leaveRequest.id}" class="block text-xs font-medium text-text">
                            {m.leave_rejection_reason?.() ?? 'Rejection Reason'}
                          </label>
                          <textarea
                            id="reason-{leaveRequest.id}"
                            name="rejectionReason"
                            placeholder={m.leave_rejection_placeholder?.() ?? 'Explain why this request is rejected...'}
                            class="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                            rows="3"
                            required
                          ></textarea>
                          <div class="flex gap-2">
                            <button
                              type="submit"
                              class="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white font-medium rounded transition-colors"
                            >
                              {m.leave_confirm_reject?.() ?? 'Confirm Rejection'}
                            </button>
                          </div>
                        </div>
                      </form>
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </div>
</div>
