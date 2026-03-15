<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button } from '$lib/components/ui';
  import { addToast } from '$lib/stores/toasts.svelte';
  import {
    CLASSROOM_BEHAVIOR_TODAY_QUERY,
    BEHAVIOR_CATEGORIES_QUERY,
    AWARD_BEHAVIOR_POINT_MUTATION,
    BATCH_AWARD_MUTATION,
    REVOKE_BEHAVIOR_POINT_MUTATION
  } from '$lib/api/queries/behavior';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  // ---- Types ----------------------------------------------------------------
  interface BehaviorCategory {
    id: string;
    name: string;
    pointValue: number;
    isPositive: boolean;
    icon: string;
    color: string;
    position: number;
  }

  interface RecentPoint {
    id: string;
    pointValue: number;
    note: string | null;
    awardedAt: string;
    revokable: boolean;
    behaviorCategory: { name: string; icon: string; color: string };
  }

  interface StudentBehavior {
    student: { id: string; name: string };
    totalPoints: number;
    positiveCount: number;
    negativeCount: number;
    recentPoints: RecentPoint[];
  }

  // ---- State ----------------------------------------------------------------
  let mode = $state<'grid' | 'quick'>('grid');
  let categories = $state<BehaviorCategory[]>([]);
  let studentBehaviors = $state<StudentBehavior[]>([]);
  let loading = $state(true);

  // Grid mode: which student popup is open
  let openStudentId = $state<string | null>(null);
  // Quick mode: selected category
  let selectedCategoryId = $state<string | null>(null);
  let selectedStudentIds = $state<Set<string>>(new Set());
  let awarding = $state(false);

  // Undo state: { pointId, studentId, timer }
  let undoStates = $state<Map<string, { timer: ReturnType<typeof setTimeout> }>>(new Map());

  // ---- Derived --------------------------------------------------------------
  let positiveCategories = $derived(categories.filter(c => c.isPositive).sort((a, b) => a.position - b.position));
  let negativeCategories = $derived(categories.filter(c => !c.isPositive).sort((a, b) => a.position - b.position));
  let todayDate = $derived(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  let totalPositive = $derived(studentBehaviors.reduce((s, sb) => s + sb.positiveCount, 0));
  let totalNegative = $derived(studentBehaviors.reduce((s, sb) => s + sb.negativeCount, 0));
  let netTotal = $derived(totalPositive - totalNegative);

  // ---- Data fetching --------------------------------------------------------
  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    try {
      const [behaviorRes, categoriesRes] = await Promise.all([
        fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: CLASSROOM_BEHAVIOR_TODAY_QUERY,
            variables: { classroomId: data.classroom.id }
          })
        }),
        fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: BEHAVIOR_CATEGORIES_QUERY,
            variables: { schoolId: data.classroom.school?.id ?? data.schoolId }
          })
        })
      ]);

      const behaviorJson = await behaviorRes.json();
      const categoriesJson = await categoriesRes.json();

      studentBehaviors = behaviorJson?.data?.classroomBehaviorToday ?? [];
      categories = categoriesJson?.data?.behaviorCategories ?? [];
    } catch {
      addToast({ title: 'Error', body: 'Failed to load behavior data', variant: 'error' });
    } finally {
      loading = false;
    }
  }

  // ---- Award ----------------------------------------------------------------
  async function awardPoint(studentId: string, categoryId: string) {
    openStudentId = null;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: AWARD_BEHAVIOR_POINT_MUTATION,
          variables: { studentId, classroomId: data.classroom.id, behaviorCategoryId: categoryId }
        })
      });
      const json = await res.json();
      const result = json?.data?.awardBehaviorPoint;

      if (result?.errors?.length) {
        addToast({ title: 'Error', body: result.errors[0].message, variant: 'error' });
        return;
      }

      // Update local state
      const bp = result.behaviorPoint;
      studentBehaviors = studentBehaviors.map(sb => {
        if (sb.student.id !== studentId) return sb;
        return {
          ...sb,
          totalPoints: result.dailyTotal,
          positiveCount: bp.pointValue > 0 ? sb.positiveCount + 1 : sb.positiveCount,
          negativeCount: bp.pointValue < 0 ? sb.negativeCount + 1 : sb.negativeCount,
          recentPoints: [bp, ...sb.recentPoints]
        };
      });

      addToast({ title: (m as any).behavior_award_success?.() ?? 'Point awarded!', body: `${bp.behaviorCategory.icon} ${bp.behaviorCategory.name}`, variant: 'success', dismissAfterMs: 3000 });

      // Undo button for 15s
      if (bp.revokable) {
        const timer = setTimeout(() => {
          undoStates.delete(bp.id);
          undoStates = new Map(undoStates);
        }, 15000);
        undoStates.set(bp.id, { timer });
        undoStates = new Map(undoStates);
      }
    } catch {
      addToast({ title: 'Error', body: 'Failed to award point', variant: 'error' });
    }
  }

  async function revokePoint(pointId: string, studentId: string) {
    const state = undoStates.get(pointId);
    if (state) {
      clearTimeout(state.timer);
      undoStates.delete(pointId);
      undoStates = new Map(undoStates);
    }

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: REVOKE_BEHAVIOR_POINT_MUTATION,
          variables: { id: pointId }
        })
      });
      const json = await res.json();
      const result = json?.data?.revokeBehaviorPoint;

      if (result?.errors?.length) {
        addToast({ title: 'Error', body: result.errors[0].message, variant: 'error' });
        return;
      }

      // Refresh data
      await loadData();
      addToast({ title: (m as any).behavior_revoke_success?.() ?? 'Point revoked', body: '', variant: 'info', dismissAfterMs: 3000 });
    } catch {
      addToast({ title: 'Error', body: 'Failed to revoke point', variant: 'error' });
    }
  }

  async function awardBatch() {
    if (!selectedCategoryId || selectedStudentIds.size === 0) return;
    awarding = true;

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: BATCH_AWARD_MUTATION,
          variables: {
            studentIds: [...selectedStudentIds],
            classroomId: data.classroom.id,
            behaviorCategoryId: selectedCategoryId
          }
        })
      });
      const json = await res.json();
      const result = json?.data?.batchAwardBehaviorPoints;

      if (result?.errors?.length) {
        addToast({ title: 'Error', body: result.errors[0].message, variant: 'error' });
        return;
      }

      const count = result.behaviorPoints?.length ?? 0;
      addToast({
        title: (m as any).behavior_batch_success?.({ count }) ?? `Points awarded to ${count} students`,
        body: '',
        variant: 'success',
        dismissAfterMs: 4000
      });

      selectedStudentIds = new Set();
      await loadData();
    } catch {
      addToast({ title: 'Error', body: 'Failed to award points', variant: 'error' });
    } finally {
      awarding = false;
    }
  }

  function toggleStudent(id: string) {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    selectedStudentIds = next;
  }

  function selectAllStudents() {
    if (selectedStudentIds.size === studentBehaviors.length) {
      selectedStudentIds = new Set();
    } else {
      selectedStudentIds = new Set(studentBehaviors.map(sb => sb.student.id));
    }
  }

  function openProjection() {
    window.open(`/teacher/classrooms/${data.classroom.id}/behavior/display`, '_blank', 'noopener');
  }

  function pointColor(total: number): string {
    if (total > 0) return 'text-emerald-600';
    if (total < 0) return 'text-red-500';
    return 'text-slate-500';
  }

  function pointBg(total: number): string {
    if (total > 0) return 'bg-emerald-50 border-emerald-200';
    if (total < 0) return 'bg-red-50 border-red-200';
    return 'bg-slate-50 border-slate-200';
  }
</script>

<svelte:head>
  <title>{data.classroom?.name} — {(m as any).behavior_title?.() ?? 'Behavior Points'}</title>
</svelte:head>

<!-- Close popup on outside click -->
<svelte:window onclick={(e) => {
  const target = e.target as HTMLElement;
  if (!target.closest('[data-student-card]')) openStudentId = null;
}} />

<div>
  <!-- Header -->
  <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
      <a href="/teacher/classrooms/{data.classroom?.id}" class="text-sm text-text-muted hover:text-primary transition-colors">
        ← {data.classroom?.name}
      </a>
      <h1 class="text-2xl font-bold text-text mt-1">
        {(m as any).behavior_title?.() ?? 'Behavior Points'}
      </h1>
      <p class="text-sm text-text-muted mt-0.5">{todayDate}</p>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm" onclick={openProjection}>
        📺 {(m as any).behavior_open_projection?.() ?? 'Open Projection'}
      </Button>
    </div>
  </div>

  <!-- Today's summary -->
  <div class="grid grid-cols-3 gap-3 mb-6">
    <div class="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-center">
      <p class="text-xs font-medium text-emerald-700 uppercase tracking-wide">{(m as any).behavior_positive?.() ?? 'Positive'}</p>
      <p class="text-2xl font-bold text-emerald-600 mt-0.5">+{totalPositive}</p>
    </div>
    <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center">
      <p class="text-xs font-medium text-slate-600 uppercase tracking-wide">{(m as any).behavior_net_points?.() ?? 'Net'}</p>
      <p class="text-2xl font-bold {pointColor(netTotal)} mt-0.5">{netTotal > 0 ? '+' : ''}{netTotal}</p>
    </div>
    <div class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
      <p class="text-xs font-medium text-red-600 uppercase tracking-wide">{(m as any).behavior_negative?.() ?? 'Negative'}</p>
      <p class="text-2xl font-bold text-red-500 mt-0.5">-{totalNegative}</p>
    </div>
  </div>

  <!-- Tab switcher -->
  <div class="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
    <button
      onclick={() => mode = 'grid'}
      class="px-4 py-2 rounded-lg text-sm font-medium transition-all {mode === 'grid' ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'}"
    >
      ⊞ {(m as any).behavior_grid_mode?.() ?? 'Grid'}
    </button>
    <button
      onclick={() => mode = 'quick'}
      class="px-4 py-2 rounded-lg text-sm font-medium transition-all {mode === 'quick' ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'}"
    >
      ⚡ {(m as any).behavior_quick_mode?.() ?? 'Quick Award'}
    </button>
  </div>

  {#if loading}
    <div class="text-center py-12 text-text-muted">Loading...</div>
  {:else if categories.length === 0}
    <Card>
      <p class="text-text-muted text-center py-4">
        {(m as any).behavior_no_categories?.() ?? 'No behavior categories configured.'}
      </p>
    </Card>
  {:else if mode === 'grid'}
    <!-- ── GRID MODE ──────────────────────────────────── -->
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {#each studentBehaviors as sb (sb.student.id)}
        <!-- Student card + popup wrapper -->
        <div class="relative" data-student-card>
          <button
            onclick={(e) => { e.stopPropagation(); openStudentId = openStudentId === sb.student.id ? null : sb.student.id; }}
            class="w-full border rounded-xl px-3 py-4 text-center transition-all hover:shadow-md active:scale-95 {pointBg(sb.totalPoints)} {openStudentId === sb.student.id ? 'ring-2 ring-primary' : ''}"
          >
            <p class="font-semibold text-text text-sm truncate">{sb.student.name}</p>
            <p class="text-2xl font-bold mt-1 {pointColor(sb.totalPoints)}">
              {sb.totalPoints > 0 ? '+' : ''}{sb.totalPoints}
            </p>
            <p class="text-xs text-text-muted mt-0.5">pts today</p>
          </button>

          <!-- Behavior popup -->
          {#if openStudentId === sb.student.id}
            <div
              class="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3"
              role="menu"
              onclick={(e) => e.stopPropagation()}
            >
              <p class="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                {(m as any).behavior_select_behavior?.() ?? 'Select behavior'}
              </p>

              <!-- Positive behaviors -->
              {#if positiveCategories.length > 0}
                <div class="space-y-1 mb-2">
                  {#each positiveCategories as cat (cat.id)}
                    <button
                      onclick={() => awardPoint(sb.student.id, cat.id)}
                      class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-emerald-50 transition-colors text-left group"
                    >
                      <span class="text-base">{cat.icon}</span>
                      <span class="flex-1 text-text font-medium">{cat.name}</span>
                      <span class="text-xs font-bold text-emerald-600 group-hover:text-emerald-700">+{cat.pointValue}</span>
                    </button>
                  {/each}
                </div>
              {/if}

              {#if negativeCategories.length > 0}
                <div class="border-t border-slate-100 pt-2 space-y-1">
                  {#each negativeCategories as cat (cat.id)}
                    <button
                      onclick={() => awardPoint(sb.student.id, cat.id)}
                      class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-red-50 transition-colors text-left group"
                    >
                      <span class="text-base">{cat.icon}</span>
                      <span class="flex-1 text-text font-medium">{cat.name}</span>
                      <span class="text-xs font-bold text-red-500 group-hover:text-red-600">{cat.pointValue}</span>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <!-- Undo toasts (inline) -->
    {#each [...undoStates.entries()] as [pointId, _state] (pointId)}
      {@const studentId = studentBehaviors.find(sb => sb.recentPoints.some(rp => rp.id === pointId))?.student.id ?? ''}
      <div class="fixed bottom-20 right-4 z-50 animate-in slide-in-from-right">
        <button
          onclick={() => revokePoint(pointId, studentId)}
          class="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-slate-700 transition-colors"
        >
          ↩ {(m as any).behavior_revoke?.() ?? 'Undo'}
        </button>
      </div>
    {/each}

  {:else}
    <!-- ── QUICK BAR MODE ─────────────────────────────── -->
    <div class="space-y-5">
      <!-- Category chips -->
      <Card>
        {#snippet header()}
          <p class="text-sm font-semibold text-text">{(m as any).behavior_select_behavior?.() ?? 'Select behavior'}</p>
        {/snippet}
        <div class="flex flex-wrap gap-2">
          {#each [...positiveCategories, ...negativeCategories] as cat (cat.id)}
            <button
              onclick={() => selectedCategoryId = selectedCategoryId === cat.id ? null : cat.id}
              class="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border-2 transition-all
                {selectedCategoryId === cat.id
                  ? 'border-primary bg-primary text-white shadow-md scale-105'
                  : 'border-slate-200 bg-white text-text hover:border-slate-300'}"
              style={selectedCategoryId === cat.id ? '' : `border-color: ${cat.color}40`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span class="font-bold {cat.isPositive ? 'text-emerald-200' : 'text-red-200'}" class:text-emerald-600={selectedCategoryId !== cat.id && cat.isPositive} class:text-red-500={selectedCategoryId !== cat.id && !cat.isPositive}>
                {cat.isPositive ? '+' : ''}{cat.pointValue}
              </span>
            </button>
          {/each}
        </div>
      </Card>

      <!-- Student list -->
      <Card>
        {#snippet header()}
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStudentIds.size === studentBehaviors.length && studentBehaviors.length > 0}
                onchange={selectAllStudents}
                class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span class="text-sm font-medium text-text">Select all ({studentBehaviors.length})</span>
            </label>
            <Button
              size="sm"
              disabled={!selectedCategoryId || selectedStudentIds.size === 0 || awarding}
              loading={awarding}
              onclick={awardBatch}
            >
              ⭐ {(m as any).behavior_award_all?.() ?? 'Award All'} ({selectedStudentIds.size})
            </Button>
          </div>
        {/snippet}
        <div class="divide-y divide-slate-100 -mx-6 -my-4">
          {#each studentBehaviors as sb (sb.student.id)}
            <label class="flex items-center gap-3 px-6 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStudentIds.has(sb.student.id)}
                onchange={() => toggleStudent(sb.student.id)}
                class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span class="flex-1 font-medium text-text">{sb.student.name}</span>
              <span class="text-sm font-bold {pointColor(sb.totalPoints)}">
                {sb.totalPoints > 0 ? '+' : ''}{sb.totalPoints}
              </span>
            </label>
          {/each}
        </div>
      </Card>
    </div>
  {/if}
</div>
