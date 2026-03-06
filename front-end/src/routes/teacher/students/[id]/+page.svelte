<script lang="ts">
  import { Card } from '$lib/components/ui';
  import { RadarChart, ProgressChart } from '$lib/components/charts';
  import { SKILL_LABELS, SKILL_BG_COLORS, SKILL_EMOJIS, SKILL_CATEGORIES } from '$lib/utils/constants';
  import { formatDate, today } from '$lib/utils/helpers';
  import type { SkillCategory } from '$lib/api/types';

  let { data } = $props();

  let showScoreForm = $state(false);
  let startingChat = $state(false);

  async function chatWithParent() {
    startingChat = true;
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation CreateConversation($studentId: ID!) {
            createConversation(studentId: $studentId) {
              conversation { id }
              errors { message path }
            }
          }`,
          variables: { studentId: data.radar.studentId }
        })
      });
      const json = await res.json();
      const conv = json?.data?.createConversation?.conversation;
      if (conv?.id) {
        window.location.href = `/teacher/messages/${conv.id}`;
      }
    } catch {
      // ignore
    } finally {
      startingChat = false;
    }
  }
  let selectedSkill = $state<SkillCategory>('READING');
  let scoreDate = $state(today());
  let scoreValue = $state('');
  let saving = $state(false);
  let alertMessage = $state('');
  let alertType = $state<'success' | 'error'>('success');

  async function saveScore() {
    const score = parseInt(scoreValue);
    if (!scoreValue || isNaN(score) || score < 0 || score > 100) {
      alertType = 'error';
      alertMessage = 'Please enter a valid score between 0 and 100.';
      return;
    }

    saving = true;
    alertMessage = '';

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation CreateDailyScore($input: CreateDailyScoreInput!) {
            createDailyScore(input: $input) {
              dailyScore { id date skillCategory score }
              errors { message path }
            }
          }`,
          variables: {
            input: {
              studentId: data.radar.studentId,
              date: scoreDate,
              skillCategory: selectedSkill.toLowerCase(),
              score
            }
          }
        })
      });

      const json = await res.json();
      const result = json?.data?.createDailyScore;

      if (result?.errors?.length) {
        alertType = 'error';
        alertMessage = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        alertType = 'success';
        alertMessage = 'Score saved!';
        showScoreForm = false;
        scoreValue = '';
        scoreDate = today();
        selectedSkill = 'READING';
        setTimeout(() => {
          alertMessage = '';
          window.location.reload();
        }, 800);
      }
    } catch {
      alertType = 'error';
      alertMessage = 'Failed to save score. Please try again.';
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>{data.radar.studentName} — GrewMe</title>
</svelte:head>

<div>
  <div class="mb-6">
    <button onclick={() => history.back()} class="text-sm text-text-muted hover:text-primary transition-colors">
      ← Back
    </button>
    <div class="flex items-center justify-between mt-2">
      <h1 class="text-2xl font-bold text-text">{data.radar.studentName}</h1>
      <button
        onclick={chatWithParent}
        disabled={startingChat}
        class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        💬 {startingChat ? 'Opening...' : 'Chat with Parent'}
      </button>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
    <!-- Radar Chart -->
    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text">Skill Radar</h2>
      {/snippet}
      <RadarChart skills={data.radar.skills} label={data.radar.studentName} size="lg" />
    </Card>

    <!-- Progress Chart -->
    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text">Weekly Progress</h2>
      {/snippet}
      <ProgressChart progress={data.progress} />
    </Card>
  </div>

  <!-- Daily Scores Table -->
  <Card>
    {#snippet header()}
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-text">Recent Scores</h2>
        <button
          onclick={() => { showScoreForm = !showScoreForm; alertMessage = ''; }}
          class="text-sm text-primary hover:underline font-medium"
        >
          {showScoreForm ? '✕ Cancel' : '+ Add Score'}
        </button>
      </div>
    {/snippet}

    {#if alertMessage}
      <div class="mb-4 px-4 py-2 rounded-lg text-sm font-medium {alertType === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}">
        {alertMessage}
      </div>
    {/if}

    {#if showScoreForm}
      <div class="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <!-- Skill pills -->
        <div class="flex flex-wrap gap-2 mb-4">
          {#each SKILL_CATEGORIES as skill}
            <button
              onclick={() => selectedSkill = skill}
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                {selectedSkill === skill
                  ? SKILL_BG_COLORS[skill] + ' ring-2 ring-offset-1 ring-primary'
                  : 'bg-white border border-slate-200 text-text-muted hover:border-slate-300'}"
            >
              {SKILL_EMOJIS[skill]} {SKILL_LABELS[skill]}
            </button>
          {/each}
        </div>

        <!-- Date + Score + Save -->
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-text-muted">Date</label>
            <input
              type="date"
              bind:value={scoreDate}
              class="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-xs font-medium text-text-muted">Score (0–100)</label>
            <input
              type="number"
              min="0"
              max="100"
              placeholder="e.g. 85"
              bind:value={scoreValue}
              class="w-28 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            />
          </div>
          <button
            onclick={saveScore}
            disabled={saving}
            class="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    {/if}

    {#if data.scores.length > 0}
      <div class="overflow-x-auto -mx-6 -my-4">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100">
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Date</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Skill</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Score</th>
              <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">Teacher</th>
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
                <td class="px-6 py-3 text-sm text-text-muted">{score.teacher.name}</td>
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
