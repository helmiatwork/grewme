<script lang="ts">
  import { onMount } from 'svelte';
  import { Card, Button } from '$lib/components/ui';
  import { CLASSROOM_BEHAVIOR_SUMMARY_QUERY } from '$lib/api/queries/behavior';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  // ---- Types ----------------------------------------------------------------
  interface ClassroomRow {
    id: string;
    name: string;
    teacherName: string;
    studentCount: number;
    totalPoints: number;
    positiveCount: number;
    negativeCount: number;
    topCategory: string | null;
  }

  // ---- State ----------------------------------------------------------------
  let classroomRows = $state<ClassroomRow[]>([]);
  let loading = $state(true);
  let weekStart = $state(getMonday(new Date()));
  let sortKey = $state<keyof ClassroomRow>('totalPoints');
  let sortDir = $state<'asc' | 'desc'>('desc');

  // ---- Derived ──────────────────────────────────────────────────────────────
  let sorted = $derived(
    [...classroomRows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === 'string' && typeof bv === 'string'
        ? av.localeCompare(bv)
        : Number(av) - Number(bv);
      return sortDir === 'asc' ? cmp : -cmp;
    })
  );

  let totalPointsWeek = $derived(classroomRows.reduce((s, r) => s + r.totalPoints, 0));

  let mostPositive = $derived(() => {
    const counts: Record<string, number> = {};
    for (const r of classroomRows) {
      if (r.topCategory) counts[r.topCategory] = (counts[r.topCategory] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] ?? '—';
  });

  // ---- Lifecycle ─────────────────────────────────────────────────────────────
  onMount(loadSummaries);

  $effect(() => {
    void weekStart; // reactively reload when week changes
    loadSummaries();
  });

  // ---- Helpers ──────────────────────────────────────────────────────────────
  function getMonday(d: Date): string {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    return date.toISOString().slice(0, 10);
  }

  function prevWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    weekStart = d.toISOString().slice(0, 10);
  }

  function nextWeek() {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    const today = getMonday(new Date());
    if (d.toISOString().slice(0, 10) <= today) weekStart = d.toISOString().slice(0, 10);
  }

  function formatWeek(dateStr: string): string {
    const d = new Date(dateStr);
    const end = new Date(dateStr);
    end.setDate(end.getDate() + 6);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  async function loadSummaries() {
    loading = true;
    const rows: ClassroomRow[] = [];

    try {
      await Promise.all(
        data.classrooms.map(async (classroom: any) => {
          try {
            const res = await fetch('/api/graphql', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: CLASSROOM_BEHAVIOR_SUMMARY_QUERY,
                variables: { classroomId: classroom.id, weekStart }
              })
            });
            const json = await res.json();
            const summaries: any[] = json?.data?.classroomBehaviorSummary ?? [];

            const totalPoints = summaries.reduce((s, x) => s + (x.totalPoints ?? 0), 0);
            const positiveCount = summaries.reduce((s, x) => s + (x.positiveCount ?? 0), 0);
            const negativeCount = summaries.reduce((s, x) => s + (x.negativeCount ?? 0), 0);

            // Find most common top category
            const catCounts: Record<string, number> = {};
            for (const s of summaries) {
              if (s.topBehaviorCategory?.name) {
                catCounts[s.topBehaviorCategory.name] = (catCounts[s.topBehaviorCategory.name] ?? 0) + 1;
              }
            }
            const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

            rows.push({
              id: classroom.id,
              name: classroom.name,
              teacherName: classroom.teacher?.name ?? '—',
              studentCount: classroom.students?.length ?? 0,
              totalPoints,
              positiveCount,
              negativeCount,
              topCategory: topCat
            });
          } catch {
            rows.push({
              id: classroom.id,
              name: classroom.name,
              teacherName: classroom.teacher?.name ?? '—',
              studentCount: classroom.students?.length ?? 0,
              totalPoints: 0,
              positiveCount: 0,
              negativeCount: 0,
              topCategory: null
            });
          }
        })
      );

      classroomRows = rows;
    } finally {
      loading = false;
    }
  }

  function toggleSort(key: keyof ClassroomRow) {
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDir = 'desc';
    }
  }

  function positivePercent(row: ClassroomRow): string {
    const total = row.positiveCount + row.negativeCount;
    if (total === 0) return '0';
    return Math.round((row.positiveCount / total) * 100).toString();
  }

  function sortIcon(key: keyof ClassroomRow): string {
    if (sortKey !== key) return '↕';
    return sortDir === 'asc' ? '↑' : '↓';
  }
</script>

<svelte:head>
  <title>{(m as any).behavior_dashboard?.() ?? 'Behavior Dashboard'}</title>
</svelte:head>

<div>
  <!-- Header -->
  <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-text">
        {(m as any).behavior_dashboard?.() ?? 'Behavior Dashboard'}
      </h1>
      <p class="text-sm text-text-muted mt-0.5">School-wide behavior overview</p>
    </div>
    <a href="/school/behavior/categories" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border-2 border-primary text-primary hover:bg-primary hover:text-white transition-colors">
      ⚙️ {(m as any).behavior_categories?.() ?? 'Manage Categories'}
    </a>
  </div>

  <!-- Week picker -->
  <div class="flex items-center gap-3 mb-6">
    <button
      onclick={prevWeek}
      class="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-text-muted hover:bg-slate-50 transition-colors"
    >‹</button>
    <span class="text-sm font-medium text-text">{formatWeek(weekStart)}</span>
    <button
      onclick={nextWeek}
      class="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-text-muted hover:bg-slate-50 transition-colors"
    >›</button>
  </div>

  <!-- Summary cards -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
    <Card>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl">⭐</div>
        <div>
          <p class="text-sm text-text-muted">{(m as any).behavior_total_this_week?.() ?? 'Total Points This Week'}</p>
          <p class="text-2xl font-bold text-text">{totalPointsWeek > 0 ? '+' : ''}{totalPointsWeek}</p>
        </div>
      </div>
    </Card>

    <Card>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-xl">😊</div>
        <div>
          <p class="text-sm text-text-muted">{(m as any).behavior_most_positive?.() ?? 'Most Common Positive'}</p>
          <p class="text-base font-bold text-emerald-600 truncate">{mostPositive()}</p>
        </div>
      </div>
    </Card>

    <Card>
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-xl">📊</div>
        <div>
          <p class="text-sm text-text-muted">Classrooms Tracked</p>
          <p class="text-2xl font-bold text-text">{data.classrooms.length}</p>
        </div>
      </div>
    </Card>
  </div>

  <!-- Classroom table -->
  <Card>
    {#snippet header()}
      <h2 class="text-lg font-semibold text-text">Classrooms</h2>
    {/snippet}

    {#if loading}
      <div class="py-8 text-center text-text-muted">{m.common_loading()}</div>
    {:else if classroomRows.length === 0}
      <p class="text-text-muted text-center py-6">No classrooms found.</p>
    {:else}
      <div class="-mx-6 -my-4 overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-slate-100 bg-slate-50">
              <th class="px-6 py-3 text-left">
                <button onclick={() => toggleSort('name')} class="flex items-center gap-1 font-semibold text-text-muted hover:text-text">
                  {(m as any).behavior_classroom_name?.() ?? 'Classroom'} <span class="text-xs">{sortIcon('name')}</span>
                </button>
              </th>
              <th class="px-4 py-3 text-left">
                <button onclick={() => toggleSort('teacherName')} class="flex items-center gap-1 font-semibold text-text-muted hover:text-text">
                  Teacher <span class="text-xs">{sortIcon('teacherName')}</span>
                </button>
              </th>
              <th class="px-4 py-3 text-center">
                <button onclick={() => toggleSort('studentCount')} class="flex items-center gap-1 font-semibold text-text-muted hover:text-text">
                  Students <span class="text-xs">{sortIcon('studentCount')}</span>
                </button>
              </th>
              <th class="px-4 py-3 text-center">
                <button onclick={() => toggleSort('totalPoints')} class="flex items-center gap-1 font-semibold text-text-muted hover:text-text">
                  {(m as any).behavior_net_points?.() ?? 'Net'} <span class="text-xs">{sortIcon('totalPoints')}</span>
                </button>
              </th>
              <th class="px-4 py-3 text-center">
                <button onclick={() => toggleSort('positiveCount')} class="flex items-center gap-1 font-semibold text-text-muted hover:text-text">
                  Positive % <span class="text-xs">{sortIcon('positiveCount')}</span>
                </button>
              </th>
              <th class="px-4 py-3 text-left">Top Behavior</th>
            </tr>
          </thead>
          <tbody>
            {#each sorted as row (row.id)}
              <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td class="px-6 py-3 font-medium text-text">
                  <a href="/school/classrooms/{row.id}" class="hover:text-primary transition-colors">
                    {row.name}
                  </a>
                </td>
                <td class="px-4 py-3 text-text-muted">{row.teacherName}</td>
                <td class="px-4 py-3 text-center text-text-muted">{row.studentCount}</td>
                <td class="px-4 py-3 text-center font-bold {row.totalPoints > 0 ? 'text-emerald-600' : row.totalPoints < 0 ? 'text-red-500' : 'text-slate-400'}">
                  {row.totalPoints > 0 ? '+' : ''}{row.totalPoints}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center gap-2">
                    <div class="flex-1 max-w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-emerald-400 rounded-full transition-all"
                        style="width: {positivePercent(row)}%"
                      ></div>
                    </div>
                    <span class="text-xs text-text-muted">{positivePercent(row)}%</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-text-muted text-xs">{row.topCategory ?? '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </Card>
</div>
