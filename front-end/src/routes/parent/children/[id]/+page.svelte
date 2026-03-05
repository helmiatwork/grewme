<script lang="ts">
  import { Card } from '$lib/components/ui';
  import { RadarChart, ProgressChart } from '$lib/components/charts';
  import { SKILL_LABELS, SKILL_BG_COLORS, SKILL_EMOJIS } from '$lib/utils/constants';
  import { formatDate } from '$lib/utils/helpers';
  import type { SkillCategory } from '$lib/api/types';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.radar.studentName} — GrewMe</title>
</svelte:head>

<div>
  <div class="mb-6">
    <a href="/parent/dashboard" class="text-sm text-text-muted hover:text-primary transition-colors">
      ← Back to My Children
    </a>
    <h1 class="text-2xl font-bold text-text mt-2">{data.radar.studentName}</h1>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text">Skill Radar</h2>
      {/snippet}
      <RadarChart skills={data.radar.skills} label={data.radar.studentName} size="lg" />
    </Card>

    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text">Weekly Progress</h2>
      {/snippet}
      <ProgressChart progress={data.progress} />
    </Card>
  </div>

  <Card>
    {#snippet header()}
      <h2 class="text-lg font-semibold text-text">Recent Scores</h2>
    {/snippet}
    {#if data.scores.length > 0}
      <div class="overflow-x-auto -mx-6 -my-4">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100">
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Date</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Skill</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Score</th>
            </tr>
          </thead>
          <tbody>
            {#each data.scores as score}
              <tr class="border-b border-slate-50">
                <td class="px-6 py-3 text-sm text-text">{formatDate(score.date)}</td>
                <td class="px-6 py-3">
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium {SKILL_BG_COLORS[score.skillCategory as SkillCategory]}">
                    {SKILL_EMOJIS[score.skillCategory as SkillCategory]}
                    {SKILL_LABELS[score.skillCategory as SkillCategory]}
                  </span>
                </td>
                <td class="px-6 py-3 text-sm font-semibold text-text">{score.score}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="text-text-muted text-center py-4">No scores recorded yet</p>
    {/if}
  </Card>
</div>
