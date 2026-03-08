<script lang="ts">
  import { Card, Button, Alert } from '$lib/components/ui';
  import { RadarChart } from '$lib/components/charts';
  import { SKILL_CATEGORIES, SKILL_LABELS, SKILL_EMOJIS, SKILL_BG_COLORS } from '$lib/utils/constants';
  import { today } from '$lib/utils/helpers';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  let selectedDate = $state(today());
  let selectedSkill = $state<string | null>(null);
  let scoreMap = $state<Record<string, number | ''>>({});
  let loadingScores = $state(false);
  let saving = $state(false);
  let successMessage = $state('');
  let errorMessage = $state('');

  $effect(() => {
    if (!selectedSkill) return;
    const skill = selectedSkill;
    const date = selectedDate;

    loadingScores = true;
    scoreMap = {};

    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query ClassroomDailyScores($classroomId: ID!, $date: ISO8601Date!, $skillCategory: SkillCategoryEnum!) {
            classroomDailyScores(classroomId: $classroomId, date: $date, skillCategory: $skillCategory) {
              id
              score
              student { id }
            }
          }
        `,
        variables: {
          classroomId: data.classroom.id,
          date,
          skillCategory: skill.toLowerCase()
        }
      })
    })
      .then(r => r.json())
      .then(res => {
        const scores: Record<string, number | ''> = {};
        for (const node of res?.data?.classroomDailyScores ?? []) {
          scores[node.student.id] = node.score;
        }
        scoreMap = scores;
      })
      .finally(() => {
        loadingScores = false;
      });
  });

  async function saveAll() {
    if (!selectedSkill) return;

    const scores = Object.entries(scoreMap)
      .filter(([, score]) => score !== '')
      .map(([studentId, score]) => ({ studentId, score: Number(score) }));

    if (scores.length === 0) return;

    saving = true;
    successMessage = '';
    errorMessage = '';

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation BulkCreateDailyScores($classroomId: ID!, $date: ISO8601Date!, $skillCategory: SkillCategoryEnum!, $scores: [BulkScoreInput!]!) {
              bulkCreateDailyScores(classroomId: $classroomId, date: $date, skillCategory: $skillCategory, scores: $scores) {
                dailyScores { id }
                errors { message path }
              }
            }
          `,
          variables: {
            classroomId: data.classroom.id,
            date: selectedDate,
            skillCategory: selectedSkill.toLowerCase(),
            scores
          }
        })
      });

      const json = await res.json();
      const result = json?.data?.bulkCreateDailyScores;

      if (result?.errors?.length > 0) {
        errorMessage = result.errors.map((e: { message: string }) => e.message).join(', ');
      } else {
        successMessage = m.classroom_scores_saved();
        setTimeout(() => location.reload(), 800);
      }
    } catch {
      errorMessage = m.classroom_scores_failed();
    } finally {
      saving = false;
    }
  }
</script>

<svelte:head>
  <title>{data.classroom.name} — {m.app_name()}</title>
</svelte:head>

<div>
  <div class="mb-6">
    <a href="/teacher/dashboard" class="text-sm text-text-muted hover:text-primary transition-colors">
      {m.classroom_back_dashboard()}
    </a>
    <h1 class="text-2xl font-bold text-text mt-2">{data.classroom.name}</h1>
    {#if data.classroom.school}
      <p class="text-text-muted">{data.classroom.school.name}</p>
    {/if}
  </div>

  <!-- Quick Score -->
  <div class="mb-6">
    <Card>
      {#snippet header()}
        <div>
          <h2 class="text-lg font-semibold text-text">{m.classroom_quick_score()}</h2>
          <p class="text-sm text-text-muted">{m.classroom_quick_score_hint()}</p>
        </div>
      {/snippet}

      <!-- Controls row -->
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="date"
          bind:value={selectedDate}
          class="border border-slate-200 rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div class="flex flex-wrap gap-2">
          {#each SKILL_CATEGORIES as skill}
            <button
              onclick={() => selectedSkill = skill}
              class="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all border {selectedSkill === skill ? SKILL_BG_COLORS[skill] + ' border-transparent text-white' : 'border-slate-200 text-text-muted hover:border-slate-300'}"
            >
              <span>{SKILL_EMOJIS[skill]}</span>
              <span>{SKILL_LABELS[skill]}</span>
            </button>
          {/each}
        </div>
      </div>

      {#if successMessage}
        <div class="mb-4"><Alert variant="success">{successMessage}</Alert></div>
      {/if}
      {#if errorMessage}
        <div class="mb-4"><Alert variant="error">{errorMessage}</Alert></div>
      {/if}

      {#if selectedSkill}
        {#if loadingScores}
          <p class="text-text-muted text-sm py-4">{m.classroom_loading_scores()}</p>
        {:else if data.classroom.students && data.classroom.students.length > 0}
          <div class="divide-y divide-slate-100 -mx-6">
            {#each data.classroom.students as student}
              <div class="flex items-center justify-between px-6 py-3">
                <span class="font-medium text-text">{student.name}</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="—"
                  value={scoreMap[student.id] ?? ''}
                  oninput={(e) => {
                    const val = (e.target as HTMLInputElement).value;
                    scoreMap[student.id] = val === '' ? '' : Number(val);
                  }}
                  class="w-20 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            {/each}
          </div>

          <div class="mt-4">
            <Button onclick={saveAll} disabled={saving} class="w-full">
              {saving ? m.classroom_saving() : m.classroom_save_all()}
            </Button>
          </div>
        {:else}
          <p class="text-text-muted text-center py-4">{m.classroom_no_students()}</p>
        {/if}
      {/if}
    </Card>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Student List -->
    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text">
          Students ({data.classroom.students?.length ?? 0})
        </h2>
      {/snippet}
      {#if data.classroom.students && data.classroom.students.length > 0}
        <div class="divide-y divide-slate-100 -mx-6 -my-4">
          {#each data.classroom.students as student}
            <a
              href="/teacher/students/{student.id}"
              class="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors"
            >
              <span class="font-medium text-text">{student.name}</span>
              <span class="text-sm text-text-muted">{m.classroom_view_arrow()}</span>
            </a>
          {/each}
        </div>
      {:else}
        <p class="text-text-muted text-center py-4">{m.classroom_no_students()}</p>
      {/if}
    </Card>

    <!-- Class Overview Radar -->
    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text">{m.classroom_class_overview()}</h2>
      {/snippet}
      {#if data.overview.students.length > 0}
        <div class="space-y-6">
          {#each data.overview.students as student}
            <div>
              <h3 class="text-sm font-medium text-text-muted mb-2">{student.studentName}</h3>
              <RadarChart skills={student.skills} label={student.studentName} size="sm" />
            </div>
          {/each}
        </div>
      {:else}
        <p class="text-text-muted text-center py-4">{m.classroom_no_data()}</p>
      {/if}
    </Card>
  </div>
</div>
