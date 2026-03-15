<script lang="ts">
  import { Card } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  // ---- Types ----------------------------------------------------------------
  interface WeeklyReport {
    id: string;
    weekStart: string;
    totalPoints: number;
    positiveCount: number;
    negativeCount: number;
    student: { id: string; name: string };
    topBehaviorCategory: {
      id: string;
      name: string;
      icon: string;
      color: string;
    } | null;
  }

  // ---- Derived ─────────────────────────────────────────────────────────────
  let reports = $derived(data.weeklyReports as WeeklyReport[]);
  let latestReport = $derived(reports[0] ?? null);
  let previousReport = $derived(reports[1] ?? null);

  // Trend vs previous week
  let trend = $derived(() => {
    if (!latestReport || !previousReport) return 'neutral';
    const diff = latestReport.totalPoints - previousReport.totalPoints;
    if (diff > 0) return 'up';
    if (diff < 0) return 'down';
    return 'neutral';
  });

  let trendDiff = $derived(() => {
    if (!latestReport || !previousReport) return 0;
    return latestReport.totalPoints - previousReport.totalPoints;
  });

  // Last 7 reports for the bar chart (oldest first)
  let chartData = $derived([...reports].reverse().slice(-7));
  let chartMax = $derived(Math.max(...chartData.map(r => Math.abs(r.totalPoints)), 1));

  let topBehaviors = $derived(() => {
    const allTop = reports
      .filter(r => r.topBehaviorCategory)
      .reduce((acc: Record<string, { cat: any; count: number }>, r) => {
        const key = r.topBehaviorCategory!.id;
        if (!acc[key]) acc[key] = { cat: r.topBehaviorCategory!, count: 0 };
        acc[key].count++;
        return acc;
      }, {});
    return Object.values(allTop).sort((a, b) => b.count - a.count).slice(0, 5);
  });

  function formatWeekDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function barHeight(points: number): string {
    return Math.round((Math.abs(points) / chartMax) * 100) + '%';
  }

  function barColor(points: number): string {
    if (points > 0) return '#10b981';
    if (points < 0) return '#ef4444';
    return '#94a3b8';
  }

  function trendIcon(t: string): string {
    if (t === 'up') return '↑';
    if (t === 'down') return '↓';
    return '→';
  }

  function trendClass(t: string): string {
    if (t === 'up') return 'text-emerald-600';
    if (t === 'down') return 'text-red-500';
    return 'text-slate-500';
  }
</script>

<svelte:head>
  <title>{data.studentName} — {(m as any).behavior_weekly_report?.() ?? 'Weekly Behavior Report'}</title>
</svelte:head>

<div>
  <!-- Header -->
  <div class="mb-6">
    <a href="/parent/children/{data.studentId}" class="text-sm text-text-muted hover:text-primary transition-colors">
      ← {data.studentName || 'Student'}
    </a>
    <h1 class="text-2xl font-bold text-text mt-1">
      {(m as any).behavior_weekly_report?.() ?? 'Weekly Behavior Report'}
    </h1>
    {#if data.studentName}
      <p class="text-text-muted">{data.studentName}</p>
    {/if}
  </div>

  {#if reports.length === 0}
    <Card>
      <p class="text-text-muted text-center py-8">
        {(m as any).behavior_no_data?.() ?? 'No behavior data available for this week.'}
      </p>
    </Card>
  {:else}
    <div class="space-y-5">
      <!-- Summary card -->
      {#if latestReport}
        <Card>
          {#snippet header()}
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-text">
                {(m as any).behavior_this_week?.() ?? 'This Week'}
              </h2>
              <span class="text-sm text-text-muted">{formatWeekDate(latestReport.weekStart)}</span>
            </div>
          {/snippet}

          <div class="grid grid-cols-3 gap-4">
            <!-- Net points -->
            <div class="text-center">
              <p class="text-3xl font-bold {latestReport.totalPoints > 0 ? 'text-emerald-600' : latestReport.totalPoints < 0 ? 'text-red-500' : 'text-slate-500'}">
                {latestReport.totalPoints > 0 ? '+' : ''}{latestReport.totalPoints}
              </p>
              <p class="text-xs text-text-muted mt-1">{(m as any).behavior_net_points?.() ?? 'Net Points'}</p>
              {#if previousReport}
                <p class="text-xs mt-1 {trendClass(trend())}">
                  {trendIcon(trend())} {Math.abs(trendDiff())} {(m as any).behavior_vs_last_week?.() ?? 'vs last week'}
                </p>
              {/if}
            </div>

            <!-- Positive -->
            <div class="text-center border-x border-slate-100">
              <p class="text-3xl font-bold text-emerald-600">+{latestReport.positiveCount}</p>
              <p class="text-xs text-text-muted mt-1">{(m as any).behavior_positive?.() ?? 'Positive'}</p>
            </div>

            <!-- Negative -->
            <div class="text-center">
              <p class="text-3xl font-bold text-red-500">-{latestReport.negativeCount}</p>
              <p class="text-xs text-text-muted mt-1">{(m as any).behavior_negative?.() ?? 'Negative'}</p>
            </div>
          </div>
        </Card>
      {/if}

      <!-- Bar chart -->
      {#if chartData.length > 1}
        <Card>
          {#snippet header()}
            <h2 class="text-base font-semibold text-text">Weekly Trend</h2>
          {/snippet}

          <div class="flex items-end justify-around gap-2" style="height: 120px">
            {#each chartData as report (report.id)}
              <div class="flex flex-col items-center gap-1 flex-1">
                <span class="text-xs font-medium {report.totalPoints > 0 ? 'text-emerald-600' : report.totalPoints < 0 ? 'text-red-500' : 'text-slate-400'}">
                  {report.totalPoints > 0 ? '+' : ''}{report.totalPoints}
                </span>
                <div class="w-full flex flex-col justify-end" style="height: 80px">
                  <div
                    class="w-full rounded-t-sm transition-all"
                    style="height: {barHeight(report.totalPoints)}; background: {barColor(report.totalPoints)}; min-height: 4px"
                  ></div>
                </div>
                <span class="text-xs text-text-muted">{formatWeekDate(report.weekStart)}</span>
              </div>
            {/each}
          </div>
        </Card>
      {/if}

      <!-- Top behaviors -->
      {#if topBehaviors().length > 0}
        <Card>
          {#snippet header()}
            <h2 class="text-base font-semibold text-text">
              {(m as any).behavior_top_behaviors?.() ?? 'Top Behaviors'}
            </h2>
          {/snippet}
          <div class="space-y-2">
            {#each topBehaviors() as item (item.cat.id)}
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style="background: {item.cat.color}20"
                >
                  {item.cat.icon}
                </div>
                <span class="flex-1 text-sm font-medium text-text">{item.cat.name}</span>
                <span class="text-sm font-bold text-text-muted bg-slate-100 px-2 py-0.5 rounded-full">
                  ×{item.count}
                </span>
              </div>
            {/each}
          </div>
        </Card>
      {/if}
    </div>
  {/if}
</div>
