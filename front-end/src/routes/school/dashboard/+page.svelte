<script lang="ts">
  import { Card } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();
</script>

<svelte:head>
  <title>School Dashboard — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">{data.overview.schoolName}</h1>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    <Card>
      {#snippet children()}
        <div class="text-center">
          <p class="text-3xl font-bold text-primary">{data.overview.classroomCount}</p>
          <p class="text-sm text-text-muted mt-1">{m.school_dashboard_classrooms_label()}</p>
        </div>
      {/snippet}
    </Card>
    <Card>
      {#snippet children()}
        <div class="text-center">
          <p class="text-3xl font-bold text-secondary">{data.overview.studentCount}</p>
          <p class="text-sm text-text-muted mt-1">{m.school_dashboard_students_label()}</p>
        </div>
      {/snippet}
    </Card>
    <Card>
      {#snippet children()}
        <div class="text-center">
          <p class="text-3xl font-bold text-amber-600">{data.overview.teacherCount}</p>
          <p class="text-sm text-text-muted mt-1">{m.school_dashboard_teachers_label()}</p>
        </div>
      {/snippet}
    </Card>
  </div>

  <h2 class="text-xl font-semibold text-text mb-4">{m.school_dashboard_all_classrooms()}</h2>

  {#if data.classrooms.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">{m.school_dashboard_no_classrooms()}</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each data.classrooms as classroom}
        <a href="/school/classrooms">
          <Card hover>
            {#snippet children()}
              <h3 class="text-lg font-semibold text-text">{classroom.name}</h3>
              {#if classroom.studentCount !== undefined}
                <p class="text-sm text-text-muted mt-1">{classroom.studentCount} students</p>
              {/if}
            {/snippet}
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
