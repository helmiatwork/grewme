<script lang="ts">
  import { Card, Button } from '$lib/components/ui';
  import { addToast } from '$lib/stores/toasts.svelte';
  import { STUDENT_BEHAVIOR_HISTORY_QUERY, REVOKE_BEHAVIOR_POINT_MUTATION } from '$lib/api/queries/behavior';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  // ---- Types ----------------------------------------------------------------
  interface BehaviorPoint {
    id: string;
    pointValue: number;
    note: string | null;
    awardedAt: string;
    revokedAt: string | null;
    revokable: boolean;
    behaviorCategory: {
      id: string;
      name: string;
      icon: string;
      color: string;
      pointValue: number;
    };
    teacher: { id: string; name: string };
  }

  // ---- State ----------------------------------------------------------------
  let history = $state<BehaviorPoint[]>(data.history ?? []);
  let startDate = $state(data.initialStartDate);
  let endDate = $state(data.initialEndDate);
  let loading = $state(false);
  let revoking = $state<string | null>(null);

  // ---- Derived ─────────────────────────────────────────────────────────────
  let activeHistory = $derived(history.filter(h => !h.revokedAt));

  let netPoints = $derived(
    activeHistory.reduce((s, h) => s + h.pointValue, 0)
  );
  let positiveCount = $derived(activeHistory.filter(h => h.pointValue > 0).length);
  let negativeCount = $derived(activeHistory.filter(h => h.pointValue < 0).length);

  // ---- Helpers ─────────────────────────────────────────────────────────────
  function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async function applyFilter() {
    loading = true;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: STUDENT_BEHAVIOR_HISTORY_QUERY,
          variables: { studentId: data.studentId, startDate, endDate }
        })
      });
      const json = await res.json();
      history = json?.data?.studentBehaviorHistory ?? [];
    } catch {
      addToast({ title: 'Error', body: 'Failed to load behavior history', variant: 'error' });
    } finally {
      loading = false;
    }
  }

  async function revokePoint(id: string) {
    revoking = id;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: REVOKE_BEHAVIOR_POINT_MUTATION,
          variables: { id }
        })
      });
      const json = await res.json();
      const result = json?.data?.revokeBehaviorPoint;

      if (result?.errors?.length) {
        addToast({ title: 'Error', body: result.errors[0].message, variant: 'error' });
        return;
      }

      history = history.map(h => h.id === id ? { ...h, revokedAt: new Date().toISOString(), revokable: false } : h);
      addToast({ title: (m as any).behavior_revoke_success?.() ?? 'Point revoked', body: '', variant: 'info', dismissAfterMs: 3000 });
    } catch {
      addToast({ title: 'Error', body: 'Failed to revoke point', variant: 'error' });
    } finally {
      revoking = null;
    }
  }
</script>

<svelte:head>
  <title>{data.studentName} — {(m as any).behavior_history?.() ?? 'Behavior History'}</title>
</svelte:head>

<div>
  <!-- Header -->
  <div class="mb-6">
    <a href="/teacher/students/{data.studentId}" class="text-sm text-text-muted hover:text-primary transition-colors">
      ← {data.studentName || 'Student'}
    </a>
    <h1 class="text-2xl font-bold text-text mt-1">
      {(m as any).behavior_history?.() ?? 'Behavior History'}
    </h1>
    {#if data.studentName}
      <p class="text-text-muted">{data.studentName}</p>
    {/if}
  </div>

  <!-- This week summary -->
  <div class="grid grid-cols-3 gap-3 mb-6">
    <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center">
      <p class="text-xs font-medium text-text-muted uppercase tracking-wide">{(m as any).behavior_net_points?.() ?? 'Net'}</p>
      <p class="text-2xl font-bold {netPoints > 0 ? 'text-emerald-600' : netPoints < 0 ? 'text-red-500' : 'text-slate-500'} mt-0.5">
        {netPoints > 0 ? '+' : ''}{netPoints}
      </p>
    </div>
    <div class="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
      <p class="text-xs font-medium text-emerald-700 uppercase tracking-wide">{(m as any).behavior_positive?.() ?? 'Positive'}</p>
      <p class="text-2xl font-bold text-emerald-600 mt-0.5">{positiveCount}</p>
    </div>
    <div class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
      <p class="text-xs font-medium text-red-600 uppercase tracking-wide">{(m as any).behavior_negative?.() ?? 'Negative'}</p>
      <p class="text-2xl font-bold text-red-500 mt-0.5">{negativeCount}</p>
    </div>
  </div>

  <!-- Date filter -->
  <Card class="mb-5">
    <div class="flex flex-wrap items-end gap-3">
      <div>
        <label class="block text-xs font-medium text-text-muted mb-1">Start Date</label>
        <input
          type="date"
          bind:value={startDate}
          class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label class="block text-xs font-medium text-text-muted mb-1">End Date</label>
        <input
          type="date"
          bind:value={endDate}
          class="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <Button size="sm" onclick={applyFilter} loading={loading}>
        Apply
      </Button>
    </div>
  </Card>

  <!-- History table -->
  <Card>
    {#snippet header()}
      <h2 class="text-lg font-semibold text-text">
        {(m as any).behavior_history?.() ?? 'Behavior History'}
        <span class="text-sm font-normal text-text-muted ml-1">({activeHistory.length} entries)</span>
      </h2>
    {/snippet}

    {#if loading}
      <div class="py-8 text-center text-text-muted">{m.common_loading()}</div>
    {:else if history.length === 0}
      <p class="text-text-muted text-center py-6">
        {(m as any).behavior_no_data?.() ?? 'No behavior data available.'}
      </p>
    {:else}
      <div class="-mx-6 -my-4 overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50">
              <th class="px-6 py-3 text-left font-semibold text-text-muted">Date</th>
              <th class="px-4 py-3 text-left font-semibold text-text-muted">Behavior</th>
              <th class="px-4 py-3 text-center font-semibold text-text-muted">Points</th>
              <th class="px-4 py-3 text-left font-semibold text-text-muted">Note</th>
              <th class="px-4 py-3 text-left font-semibold text-text-muted">Awarded by</th>
              <th class="px-4 py-3 text-center font-semibold text-text-muted">Action</th>
            </tr>
          </thead>
          <tbody>
            {#each history as point (point.id)}
              <tr class="border-b border-slate-50 {point.revokedAt ? 'opacity-40' : 'hover:bg-slate-50'} transition-colors">
                <td class="px-6 py-3 text-text-muted text-xs whitespace-nowrap">
                  {formatDateTime(point.awardedAt)}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style="background: {point.behaviorCategory.color}20"
                    >
                      {point.behaviorCategory.icon}
                    </div>
                    <span class="font-medium text-text">{point.behaviorCategory.name}</span>
                    {#if point.revokedAt}
                      <span class="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">revoked</span>
                    {/if}
                  </div>
                </td>
                <td class="px-4 py-3 text-center font-bold {point.pointValue > 0 ? 'text-emerald-600' : 'text-red-500'}">
                  {point.pointValue > 0 ? '+' : ''}{point.pointValue}
                </td>
                <td class="px-4 py-3 text-text-muted text-xs max-w-32 truncate">
                  {point.note ?? '—'}
                </td>
                <td class="px-4 py-3 text-text-muted text-xs">
                  {point.teacher?.name ?? '—'}
                </td>
                <td class="px-4 py-3 text-center">
                  {#if point.revokable && !point.revokedAt}
                    <button
                      onclick={() => revokePoint(point.id)}
                      disabled={revoking === point.id}
                      class="text-xs text-slate-500 hover:text-red-500 transition-colors border border-slate-200 hover:border-red-300 px-2 py-1 rounded-lg disabled:opacity-50"
                    >
                      {revoking === point.id ? '...' : (m as any).behavior_revoke?.() ?? 'Undo'}
                    </button>
                  {:else}
                    <span class="text-xs text-slate-300">—</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </Card>
</div>
