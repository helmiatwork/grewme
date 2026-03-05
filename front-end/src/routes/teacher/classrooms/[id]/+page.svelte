<script lang="ts">
  import { Card } from '$lib/components/ui';
  import { RadarChart } from '$lib/components/charts';

  let { data } = $props();
</script>

<svelte:head>
  <title>{data.classroom.name} — GrewMe</title>
</svelte:head>

<div>
  <div class="mb-6">
    <a href="/teacher/dashboard" class="text-sm text-text-muted hover:text-primary transition-colors">
      ← Back to Dashboard
    </a>
    <h1 class="text-2xl font-bold text-text mt-2">{data.classroom.name}</h1>
    {#if data.classroom.school}
      <p class="text-text-muted">{data.classroom.school.name}</p>
    {/if}
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
              <span class="text-sm text-text-muted">View →</span>
            </a>
          {/each}
        </div>
      {:else}
        <p class="text-text-muted text-center py-4">No students enrolled</p>
      {/if}
    </Card>

    <!-- Class Overview Radar -->
    <Card>
      {#snippet header()}
        <h2 class="text-lg font-semibold text-text">Class Overview</h2>
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
        <p class="text-text-muted text-center py-4">No data available</p>
      {/if}
    </Card>
  </div>
</div>
