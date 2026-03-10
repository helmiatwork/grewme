<script lang="ts">
  import { enhance } from '$app/forms';
  import { Card, Button } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();

  const onboarding = $derived(data.onboardingStatus);
  const showOnboarding = $derived(onboarding && !onboarding.onboardingCompletedAt);

  const onboardingSteps = $derived(onboarding ? [
    { label: m.onboarding_step_profile?.() ?? 'School Profile', complete: onboarding.profileComplete },
    { label: m.onboarding_step_academic_year?.() ?? 'Academic Year', complete: onboarding.academicYearComplete },
    { label: m.onboarding_step_subjects?.() ?? 'Subjects', complete: onboarding.subjectsComplete },
    { label: m.onboarding_step_classrooms?.() ?? 'Classrooms', complete: onboarding.classroomsComplete },
    { label: m.onboarding_step_teachers?.() ?? 'Invite Teachers', complete: onboarding.teachersInvited },
    { label: m.onboarding_step_leave?.() ?? 'Leave Settings', complete: onboarding.leaveSettingsConfigured }
  ] : []);

  const completedCount = $derived(onboardingSteps.filter(s => s.complete).length);
</script>

<svelte:head>
  <title>School Dashboard — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">{data.overview.schoolName}</h1>

  {#if showOnboarding}
    <div class="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20 p-6 mb-6">
      <div class="flex items-start justify-between mb-4">
        <div>
          <h2 class="text-lg font-semibold text-text flex items-center gap-2">
            🚀 {m.onboarding_dashboard_title?.() ?? 'Complete your school setup'}
          </h2>
          <p class="text-sm text-text-muted mt-1">
            {m.onboarding_dashboard_progress?.({ completed: completedCount.toString(), total: '6' }) ?? `${completedCount} of 6 steps completed`}
          </p>
        </div>
        <form method="POST" action="?/dismissOnboarding" use:enhance>
          <button type="submit" class="text-xs text-text-muted hover:text-text transition-colors">
            {m.onboarding_dashboard_dismiss?.() ?? 'Dismiss'}
          </button>
        </form>
      </div>

      <!-- Progress bar -->
      <div class="h-2 bg-white/50 rounded-full overflow-hidden mb-4">
        <div class="h-full bg-primary rounded-full transition-all duration-500" style="width: {(completedCount / 6) * 100}%"></div>
      </div>

      <!-- Checklist -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
        {#each onboardingSteps as step}
          <div class="flex items-center gap-2 text-sm">
            {#if step.complete}
              <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-text-muted line-through">{step.label}</span>
            {:else}
              <div class="w-4 h-4 rounded-full border-2 border-slate-300 flex-shrink-0"></div>
              <span class="text-text">{step.label}</span>
            {/if}
          </div>
        {/each}
      </div>

      <a href="/school/onboarding">
        <Button>{m.onboarding_dashboard_continue?.() ?? 'Continue Setup'}</Button>
      </a>
    </div>
  {/if}

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
