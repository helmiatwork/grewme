<script lang="ts">
  import { enhance } from '$app/forms';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  // ── State ──────────────────────────────────────────────────────────────────
  let showForm = $state(false);
  let selectedChild = $state<string>('');
  let selectedType = $state<string>('sick');
  let startDate = $state<string>('');
  let endDate = $state<string>('');
  let reason = $state<string>('');
  let successMessage = $state<string>('');
  let errorMessage = $state<string>('');
  let deleteConfirmId = $state<string | null>(null);
  let filterStatus = $state<'all' | 'pending' | 'approved' | 'rejected'>('all');
  let submitting = $state(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredRequests = $derived(
    (data.leaveRequests ?? []).filter((req: any) => {
      if (filterStatus === 'all') return true;
      return req.status?.toLowerCase() === filterStatus;
    })
  );

  const daysCount = $derived.by(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  function resetForm() {
    selectedChild = '';
    selectedType = 'sick';
    startDate = '';
    endDate = '';
    reason = '';
    showForm = false;
  }

  function getStatusBadgeColor(status: string) {
    const lower = status?.toLowerCase() ?? '';
    if (lower === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (lower === 'approved') return 'bg-green-100 text-green-800';
    if (lower === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }

  function getTypeBadgeColor(type: string) {
    const lower = type?.toLowerCase() ?? '';
    if (lower === 'sick') return 'bg-orange-100 text-orange-800';
    if (lower === 'excused') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Leave Requests — GrewMe</title>
</svelte:head>

<div class="max-w-4xl mx-auto py-8 px-4">
  <!-- ── Header ────────────────────────────────────────────────────────────── -->
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-text">{m.leave_title()}</h1>
    <button
      onclick={() => (showForm = !showForm)}
      class="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors font-medium"
    >
      {m.leave_new()}
    </button>
  </div>

  <!-- ── Success/Error Messages ────────────────────────────────────────────── -->
  {#if successMessage}
    <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
      <span>{successMessage}</span>
      <button
        onclick={() => (successMessage = '')}
        class="text-green-700 hover:text-green-900 font-bold"
      >
        ×
      </button>
    </div>
  {/if}

  {#if errorMessage}
    <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
      <span>{errorMessage}</span>
      <button
        onclick={() => (errorMessage = '')}
        class="text-red-700 hover:text-red-900 font-bold"
      >
        ×
      </button>
    </div>
  {/if}

  <!-- ── New Leave Request Form ────────────────────────────────────────────── -->
  {#if showForm}
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
      <h2 class="text-lg font-semibold text-text mb-4">{m.leave_new()}</h2>

      <form
        method="POST"
        action="?/create"
        use:enhance={() => {
          submitting = true;
          return async ({ result, update }) => {
            submitting = false;
            if (result.type === 'success') {
              successMessage = result.data?.success ?? 'Leave request submitted successfully';
              errorMessage = '';
              resetForm();
              setTimeout(() => (successMessage = ''), 3000);
              await update();
            } else if (result.type === 'failure') {
              errorMessage = result.data?.error ?? 'Failed to submit request';
              setTimeout(() => (errorMessage = ''), 5000);
            }
          };
        }}
        class="space-y-4"
      >
        <!-- Child Select -->
        <div>
          <label for="child" class="block text-sm font-medium text-text mb-1">
            {m.leave_child_label()}
          </label>
          <select
            id="child"
            name="studentId"
            bind:value={selectedChild}
            required
            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">— {m.leave_child_label()} —</option>
            {#each data.children ?? [] as child}
              <option value={child.id}>{child.name}</option>
            {/each}
          </select>
        </div>

        <!-- Leave Type Select -->
        <div>
          <label for="type" class="block text-sm font-medium text-text mb-1">
            {m.leave_type_label()}
          </label>
          <select
            id="type"
            name="requestType"
            bind:value={selectedType}
            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="sick">{m.leave_type_sick()}</option>
            <option value="excused">{m.leave_type_excused()}</option>
          </select>
        </div>

        <!-- Date Range -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="startDate" class="block text-sm font-medium text-text mb-1">
              {m.leave_start_date()}
            </label>
            <input
              id="startDate"
              type="date"
              name="startDate"
              bind:value={startDate}
              required
              class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label for="endDate" class="block text-sm font-medium text-text mb-1">
              {m.leave_end_date()}
            </label>
            <input
              id="endDate"
              type="date"
              name="endDate"
              bind:value={endDate}
              required
              class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        {#if daysCount > 0}
          <p class="text-sm text-text-muted">
            {daysCount} {daysCount === 1 ? 'day' : 'days'}
          </p>
        {/if}

        <!-- Reason Textarea -->
        <div>
          <label for="reason" class="block text-sm font-medium text-text mb-1">
            {m.leave_reason()}
          </label>
          <textarea
            id="reason"
            name="reason"
            bind:value={reason}
            placeholder={m.leave_reason_placeholder()}
            rows={3}
            class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          ></textarea>
        </div>

        <!-- Form Actions -->
        <div class="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !selectedChild || !startDate || !endDate}
            class="bg-primary text-white rounded-lg px-4 py-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {submitting ? 'Submitting...' : m.leave_submit()}
          </button>
          <button
            type="button"
            onclick={() => resetForm()}
            class="bg-gray-100 text-text rounded-lg px-4 py-2 hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  {/if}

  <!-- ── Filter Buttons ────────────────────────────────────────────────────── -->
  <div class="flex gap-2 mb-6 flex-wrap">
    {#each ['all', 'pending', 'approved', 'rejected'] as status}
      <button
        onclick={() => (filterStatus = status)}
        class="px-4 py-2 rounded-lg font-medium transition-colors {filterStatus === status
          ? 'bg-primary text-white'
          : 'bg-gray-100 text-text hover:bg-gray-200'}"
      >
        {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
      </button>
    {/each}
  </div>

  <!-- ── Leave Requests List ──────────────────────────────────────────────── -->
  {#if filteredRequests.length > 0}
    <div class="space-y-4">
      {#each filteredRequests as request (request.id)}
        <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-6">
          <!-- Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-text">{request.student?.name ?? 'Unknown'}</h3>
              <p class="text-sm text-text-muted mt-1">
                {formatDate(request.startDate)} – {formatDate(request.endDate)}
                <span class="text-text-muted">({request.daysCount} {request.daysCount === 1 ? 'day' : 'days'})</span>
              </p>
            </div>
            <div class="flex gap-2 flex-wrap justify-end">
              <span class="inline-block px-3 py-1 rounded-full text-xs font-medium {getTypeBadgeColor(request.requestType)}">
                {request.requestType === 'sick' ? m.leave_type_sick() : m.leave_type_excused()}
              </span>
              <span class="inline-block px-3 py-1 rounded-full text-xs font-medium {getStatusBadgeColor(request.status)}">
                {request.status?.charAt(0).toUpperCase() + request.status?.slice(1).toLowerCase()}
              </span>
            </div>
          </div>

          <!-- Reason -->
          {#if request.reason}
            <div class="mb-4 pb-4 border-b border-slate-100">
              <p class="text-sm text-text-muted font-medium mb-1">Reason:</p>
              <p class="text-sm text-text">{request.reason}</p>
            </div>
          {/if}

          <!-- Rejection Reason (if rejected) -->
          {#if request.status?.toLowerCase() === 'rejected' && request.rejectionReason}
            <div class="mb-4 pb-4 border-b border-slate-100 bg-red-50 rounded-lg p-3">
              <p class="text-sm text-red-800 font-medium mb-1">Rejection Reason:</p>
              <p class="text-sm text-red-700">{request.rejectionReason}</p>
            </div>
          {/if}

          <!-- Reviewed Info (if reviewed) -->
          {#if request.reviewedAt && request.reviewedBy}
            <div class="mb-4 pb-4 border-b border-slate-100">
              <p class="text-xs text-text-muted">
                {m.leave_reviewed_by()} {request.reviewedBy.name} on {formatDate(request.reviewedAt)}
              </p>
            </div>
          {/if}

          <!-- Actions -->
          <div class="flex gap-2">
            {#if request.status?.toLowerCase() === 'pending'}
              <form
                method="POST"
                action="?/delete"
                use:enhance={() => {
                  return async ({ result, update }) => {
                    if (result.type === 'success') {
                      successMessage = result.data?.success ?? 'Leave request deleted';
                      errorMessage = '';
                      deleteConfirmId = null;
                      setTimeout(() => (successMessage = ''), 3000);
                      await update();
                    } else if (result.type === 'failure') {
                      errorMessage = result.data?.error ?? 'Failed to delete request';
                      setTimeout(() => (errorMessage = ''), 5000);
                    }
                  };
                }}
              >
                <input type="hidden" name="leaveRequestId" value={request.id} />
                {#if deleteConfirmId === request.id}
                  <div class="flex gap-2">
                    <button
                      type="submit"
                      class="bg-red-500 text-white rounded-lg px-3 py-1 text-sm hover:bg-red-600 transition-colors"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onclick={() => (deleteConfirmId = null)}
                      class="bg-gray-200 text-text rounded-lg px-3 py-1 text-sm hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                {:else}
                  <button
                    type="button"
                    onclick={() => (deleteConfirmId = request.id)}
                    class="bg-gray-100 text-text rounded-lg px-3 py-1 text-sm hover:bg-gray-200 transition-colors"
                  >
                    {m.leave_delete()}
                  </button>
                {/if}
              </form>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 px-6 py-12 text-center">
      <p class="text-text-muted">{m.leave_no_requests()}</p>
    </div>
  {/if}
</div>
