<script lang="ts">
  import { Card, Badge } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  // Group masteries by subject > topic
  const masteryBySubject = $derived(() => {
    const grouped: Record<string, {
      subjectName: string;
      topics: Record<string, {
        topicName: string;
        topicId: string;
        objectives: typeof data.masteries;
      }>;
    }> = {};

    for (const mastery of data.masteries) {
      const subject = mastery.learningObjective.topic.subject;
      const topic = mastery.learningObjective.topic;

      if (!grouped[subject.id]) {
        grouped[subject.id] = { subjectName: subject.name, topics: {} };
      }
      if (!grouped[subject.id].topics[topic.id]) {
        grouped[subject.id].topics[topic.id] = {
          topicName: topic.name,
          topicId: topic.id,
          objectives: []
        };
      }
      grouped[subject.id].topics[topic.id].objectives.push(mastery);
    }

    return grouped;
  });

  function masteryStatus(mastery: { examMastered: boolean; dailyMastered: boolean; mastered: boolean }) {
    if (mastery.mastered || (mastery.examMastered && mastery.dailyMastered)) return 'mastered';
    if (mastery.examMastered || mastery.dailyMastered) return 'partial';
    return 'none';
  }

  function masteryBadgeClass(status: string) {
    if (status === 'mastered') return 'bg-green-100 text-green-700';
    if (status === 'partial') return 'bg-yellow-100 text-yellow-700';
    return 'bg-slate-100 text-slate-500';
  }

  function masteryBadgeLabel(status: string) {
    if (status === 'mastered') return m.parent_exams_mastered();
    if (status === 'partial') return m.parent_exams_in_progress();
    return m.parent_exams_not_started();
  }

  function submissionStatusVariant(status: string): 'warning' | 'primary' | 'success' | 'default' {
    if (status === 'in_progress') return 'warning';
    if (status === 'submitted') return 'primary';
    if (status === 'graded') return 'success';
    return 'default';
  }

  function submissionStatusLabel(status: string) {
    if (status === 'in_progress') return 'In Progress';
    if (status === 'submitted') return 'Submitted';
    if (status === 'graded') return 'Graded';
    return status;
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>{data.child.name}'s Exams — GrewMe</title>
</svelte:head>

<div>
  <div class="mb-6">
    <nav class="text-sm text-text-muted mb-2">
      <a href="/parent/dashboard" class="hover:text-primary transition-colors">My Children</a>
      <span class="mx-2">›</span>
      <a href="/parent/children/{data.child.id}" class="hover:text-primary transition-colors">{data.child.name}</a>
      <span class="mx-2">›</span>
      <span class="text-text">Exams</span>
    </nav>
    <h1 class="text-2xl font-bold text-text">{data.child.name}'s Exams</h1>
  </div>

  <!-- Mastery Overview -->
  <div class="mb-8">
    <h2 class="text-lg font-semibold text-text mb-4">{m.parent_exams_mastery_overview()}</h2>

    {#if data.masteries.length === 0}
      <div class="text-center py-8 text-text-muted">
        <p>{m.parent_exams_no_mastery()}</p>
      </div>
    {:else}
      <div class="space-y-6">
        {#each Object.entries(masteryBySubject()) as [subjectId, subject]}
          <Card>
            {#snippet header()}
              <h3 class="text-base font-semibold text-text">{subject.subjectName}</h3>
            {/snippet}
            <div class="space-y-4">
              {#each Object.entries(subject.topics) as [topicId, topic]}
                <div>
                  <p class="text-sm font-medium text-text-muted mb-2">{topic.topicName}</p>
                  <div class="space-y-2">
                    {#each topic.objectives as mastery (mastery.id)}
                      {@const status = masteryStatus(mastery)}
                      <div class="flex items-start justify-between gap-4">
                        <p class="text-sm text-text flex-1">{mastery.learningObjective.description}</p>
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0 {masteryBadgeClass(status)}">
                          {masteryBadgeLabel(status)}
                        </span>
                      </div>
                    {/each}
                  </div>
                </div>
              {/each}
            </div>
          </Card>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Exam Results -->
  <div>
    <h2 class="text-lg font-semibold text-text mb-4">{m.parent_exams_results()}</h2>

    {#if data.examResults.length === 0}
      <div class="text-center py-8 text-text-muted">
        <p>{m.parent_exams_no_results()}</p>
      </div>
    {:else}
      <Card>
        <div class="overflow-x-auto -mx-6 -my-4">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-100">
                <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">{m.parent_exams_col_exam()}</th>
                <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">{m.parent_exams_col_type()}</th>
                <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">{m.parent_exams_col_classroom()}</th>
                <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">{m.parent_exams_col_status()}</th>
                <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">{m.parent_exams_col_score()}</th>
                <th class="text-left px-6 py-3 text-sm font-medium text-text-muted">{m.parent_exams_col_date()}</th>
              </tr>
            </thead>
            <tbody>
              {#each data.examResults as result (result.id)}
                <tr class="border-b border-slate-50">
                  <td class="px-6 py-3 text-sm font-medium text-text">{result.exam.title}</td>
                  <td class="px-6 py-3">
                    <Badge>{result.exam.examType.replace('_', ' ')}</Badge>
                  </td>
                  <td class="px-6 py-3 text-sm text-text-muted">{result.classroom.name}</td>
                  <td class="px-6 py-3">
                    <Badge variant={submissionStatusVariant(result.status)}>
                      {submissionStatusLabel(result.status)}
                    </Badge>
                  </td>
                  <td class="px-6 py-3 text-sm text-text">
                    {#if result.score !== null && result.score !== undefined}
                      {result.score}{result.exam.maxScore ? ` / ${result.exam.maxScore}` : ''}
                    {:else}
                      —
                    {/if}
                  </td>
                  <td class="px-6 py-3 text-sm text-text-muted">
                    {formatDate(result.submittedAt ?? result.gradedAt)}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </Card>
    {/if}
  </div>
</div>
