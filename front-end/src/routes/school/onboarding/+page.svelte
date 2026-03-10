<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { Button, Input, Alert } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data, form } = $props();

  let currentStep = $state(0);
  let submitting = $state(false);

  const steps = $derived([
    {
      key: 'profile',
      label: m.onboarding_step_profile?.() ?? 'School Profile',
      complete: data.onboardingStatus?.profileComplete
    },
    {
      key: 'academicYear',
      label: m.onboarding_step_academic_year?.() ?? 'Academic Year',
      complete: data.onboardingStatus?.academicYearComplete
    },
    {
      key: 'subjects',
      label: m.onboarding_step_subjects?.() ?? 'Subjects',
      complete: data.onboardingStatus?.subjectsComplete
    },
    {
      key: 'classrooms',
      label: m.onboarding_step_classrooms?.() ?? 'Classrooms',
      complete: data.onboardingStatus?.classroomsComplete
    },
    {
      key: 'teachers',
      label: m.onboarding_step_teachers?.() ?? 'Invite Teachers',
      complete: data.onboardingStatus?.teachersInvited
    },
    {
      key: 'leave',
      label: m.onboarding_step_leave?.() ?? 'Leave Settings',
      complete: data.onboardingStatus?.leaveSettingsConfigured
    }
  ]);

  const completedCount = $derived(steps.filter((s) => s.complete).length);

  $effect(() => {
    if (form?.success) {
      submitting = false;
      invalidateAll();
    }
  });
</script>

<svelte:head>
  <title>Setup — {data.school?.name ?? 'GrewMe'}</title>
</svelte:head>

<div class="min-h-screen flex">
  <!-- Sidebar -->
  <div class="w-72 bg-surface border-r border-slate-100 p-6 flex flex-col">
    <div class="mb-8">
      <h1 class="text-xl font-bold text-text">{m.onboarding_title?.() ?? 'Set Up Your School'}</h1>
      <p class="text-sm text-text-muted mt-1">{data.school?.name}</p>
      <div class="mt-3 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          class="h-full bg-primary rounded-full transition-all duration-300"
          style="width: {(completedCount / 6) * 100}%"
        ></div>
      </div>
      <p class="text-xs text-text-muted mt-1">
        {m.onboarding_dashboard_progress?.({ completed: completedCount.toString(), total: '6' }) ??
          `${completedCount} of 6 steps`}
      </p>
    </div>

    <nav class="flex-1 space-y-1">
      {#each steps as step, i}
        <button
          type="button"
          onclick={() => (currentStep = i)}
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors
            {currentStep === i ? 'bg-primary/10 text-primary' : 'text-text hover:bg-slate-50'}"
        >
          <div
            class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0
            {step.complete
              ? 'bg-green-100 text-green-600'
              : currentStep === i
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-text-muted'}"
          >
            {#if step.complete}
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
                ><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg
              >
            {:else}
              {i + 1}
            {/if}
          </div>
          <span class="text-sm font-medium">{step.label}</span>
        </button>
      {/each}
    </nav>

    <form method="POST" action="?/completeOnboarding" class="mt-6">
      <Button type="submit" class="w-full">{m.onboarding_finish?.() ?? 'Finish Setup'}</Button>
    </form>
  </div>

  <!-- Main Content -->
  <div class="flex-1 p-8 max-w-2xl">
    {#if form?.error}
      <div class="mb-4">
        <Alert variant="error">{form.error}</Alert>
      </div>
    {/if}
    {#if form?.success}
      <div class="mb-4">
        <Alert variant="success">{m.onboarding_complete?.() ?? 'Saved!'}</Alert>
      </div>
    {/if}

    <!-- Step 0: School Profile -->
    {#if currentStep === 0}
      <h2 class="text-xl font-bold text-text mb-2">{m.onboarding_step_profile?.() ?? 'School Profile'}</h2>
      <p class="text-sm text-text-muted mb-6">
        {m.onboarding_subtitle?.() ?? 'Add contact details for your school'}
      </p>
      <form
        method="POST"
        action="?/updateProfile"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            submitting = false;
            await update();
          };
        }}
        class="space-y-4"
      >
        <Input
          label={m.onboarding_profile_phone?.() ?? 'Phone'}
          type="tel"
          name="phone"
          value={data.school?.phone ?? ''}
          placeholder="+62 21 1234 5678"
        />
        <Input
          label={m.onboarding_profile_email?.() ?? 'Email'}
          type="email"
          name="email"
          value={data.school?.email ?? ''}
          placeholder="info@school.com"
        />
        <Input
          label={m.onboarding_profile_website?.() ?? 'Website'}
          type="url"
          name="website"
          value={data.school?.website ?? ''}
          placeholder="https://school.com"
        />
        <div class="flex gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? m.onboarding_profile_saving?.() ?? 'Saving...' : m.onboarding_profile_save?.() ?? 'Save'}
          </Button>
          <Button variant="ghost" onclick={() => (currentStep = 1)}>
            {m.onboarding_skip?.() ?? 'Skip'}
          </Button>
        </div>
      </form>

      <!-- Step 1: Academic Year -->
    {:else if currentStep === 1}
      <h2 class="text-xl font-bold text-text mb-2">
        {m.onboarding_step_academic_year?.() ?? 'Academic Year'}
      </h2>
      <p class="text-sm text-text-muted mb-6">
        {m.onboarding_academic_year_hint?.() ?? 'Create your current academic year.'}
      </p>

      {#if data.school?.academicYears?.length > 0}
        <div class="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p class="text-sm text-green-800 font-medium">Academic year already created:</p>
          {#each data.school.academicYears as ay}
            <p class="text-sm text-green-700 mt-1">{ay.label} ({ay.startDate} — {ay.endDate})</p>
          {/each}
        </div>
      {:else}
        <form
          method="POST"
          action="?/createAcademicYear"
          use:enhance={() => {
            submitting = true;
            return async ({ update }) => {
              submitting = false;
              await update();
            };
          }}
          class="space-y-4"
        >
          <input type="hidden" name="schoolId" value={data.school?.id ?? ''} />
          <Input
            label={m.academic_years_label?.() ?? 'Label'}
            type="text"
            name="label"
            placeholder="2025/2026"
            required
          />
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="startDate" class="block text-sm font-medium text-text mb-1">
                {m.academic_years_start_date?.() ?? 'Start Date'}
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                required
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label for="endDate" class="block text-sm font-medium text-text mb-1">
                {m.academic_years_end_date?.() ?? 'End Date'}
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                required
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? m.academic_years_creating?.() ?? 'Creating...' : m.academic_years_create_btn?.() ?? 'Create'}
          </Button>
        </form>
      {/if}
      <div class="flex gap-3 mt-6">
        <Button variant="ghost" onclick={() => (currentStep = 0)}>
          {m.onboarding_back?.() ?? 'Back'}
        </Button>
        <Button variant="ghost" onclick={() => (currentStep = 2)}>
          {m.onboarding_next?.() ?? 'Next'}
        </Button>
      </div>

      <!-- Step 2: Subjects -->
    {:else if currentStep === 2}
      <h2 class="text-xl font-bold text-text mb-2">{m.onboarding_step_subjects?.() ?? 'Subjects'}</h2>
      <p class="text-sm text-text-muted mb-6">
        {m.onboarding_subjects_hint?.() ?? 'Add subjects taught at your school.'}
      </p>

      {#if data.subjects?.length > 0}
        <div class="mb-4 space-y-2">
          {#each data.subjects as subject}
            <div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <span class="w-2 h-2 bg-primary rounded-full"></span>
              <span class="text-sm text-text">{subject.name}</span>
            </div>
          {/each}
        </div>
      {/if}

      <form
        method="POST"
        action="?/createSubject"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            submitting = false;
            await update();
          };
        }}
        class="flex gap-3"
      >
        <input type="hidden" name="schoolId" value={data.school?.id ?? ''} />
        <div class="flex-1">
          <Input
            type="text"
            name="subjectName"
            placeholder={m.onboarding_subjects_name_placeholder?.() ?? 'e.g. Mathematics'}
            required
          />
        </div>
        <Button type="submit" disabled={submitting}>{m.onboarding_subjects_add?.() ?? 'Add'}</Button>
      </form>
      <div class="flex gap-3 mt-6">
        <Button variant="ghost" onclick={() => (currentStep = 1)}>
          {m.onboarding_back?.() ?? 'Back'}
        </Button>
        <Button variant="ghost" onclick={() => (currentStep = 3)}>
          {m.onboarding_next?.() ?? 'Next'}
        </Button>
      </div>

      <!-- Step 3: Classrooms -->
    {:else if currentStep === 3}
      <h2 class="text-xl font-bold text-text mb-2">{m.onboarding_step_classrooms?.() ?? 'Classrooms'}</h2>
      <p class="text-sm text-text-muted mb-6">
        {m.onboarding_classrooms_hint?.() ?? 'Create classrooms for your school.'}
      </p>
      <p class="text-sm text-text-muted italic mb-4">
        Classroom creation uses the existing classrooms page. You can set this up later from the Classrooms menu.
      </p>

      {#if data.classrooms?.length > 0}
        <div class="mb-4 space-y-2">
          {#each data.classrooms as cls}
            <div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <span class="w-2 h-2 bg-primary rounded-full"></span>
              <span class="text-sm text-text">{cls.name}</span>
            </div>
          {/each}
        </div>
      {/if}

      <div class="flex gap-3 mt-6">
        <Button variant="ghost" onclick={() => (currentStep = 2)}>
          {m.onboarding_back?.() ?? 'Back'}
        </Button>
        <Button variant="ghost" onclick={() => (currentStep = 4)}>
          {m.onboarding_next?.() ?? 'Next'}
        </Button>
      </div>

      <!-- Step 4: Invite Teachers -->
    {:else if currentStep === 4}
      <h2 class="text-xl font-bold text-text mb-2">{m.onboarding_step_teachers?.() ?? 'Invite Teachers'}</h2>
      <p class="text-sm text-text-muted mb-6">
        {m.onboarding_teachers_hint?.() ?? 'Invite teachers by email.'}
      </p>

      {#if data.invitations?.length > 0}
        <div class="mb-4">
          <p class="text-sm font-medium text-text mb-2">{m.onboarding_teachers_invited?.() ?? 'Invited'}</p>
          <div class="space-y-2">
            {#each data.invitations as inv}
              <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span class="text-sm text-text">{inv.email}</span>
                <span
                  class="text-xs px-2 py-0.5 rounded-full
                  {inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}"
                >
                  {inv.status}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <form
        method="POST"
        action="?/createInvitation"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            submitting = false;
            await update();
          };
        }}
        class="flex gap-3"
      >
        <div class="flex-1">
          <Input
            type="email"
            name="teacherEmail"
            placeholder={m.onboarding_teachers_email_placeholder?.() ?? 'teacher@school.com'}
            required
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? m.onboarding_teachers_sending?.() ?? 'Sending...' : m.onboarding_teachers_send?.() ?? 'Send'}
        </Button>
      </form>
      <div class="flex gap-3 mt-6">
        <Button variant="ghost" onclick={() => (currentStep = 3)}>
          {m.onboarding_back?.() ?? 'Back'}
        </Button>
        <Button variant="ghost" onclick={() => (currentStep = 5)}>
          {m.onboarding_next?.() ?? 'Next'}
        </Button>
      </div>

      <!-- Step 5: Leave Settings -->
    {:else if currentStep === 5}
      <h2 class="text-xl font-bold text-text mb-2">{m.onboarding_step_leave?.() ?? 'Leave Settings'}</h2>
      <p class="text-sm text-text-muted mb-6">
        {m.onboarding_leave_hint?.() ?? 'Configure leave limits for teachers.'}
      </p>

      <form
        method="POST"
        action="?/updateLeaveSettings"
        use:enhance={() => {
          submitting = true;
          return async ({ update }) => {
            submitting = false;
            await update();
          };
        }}
        class="space-y-4"
      >
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="maxAnnualLeaveDays" class="block text-sm font-medium text-text mb-1">
              {m.school_leave_max_annual?.() ?? 'Max Annual Leave Days'}
            </label>
            <input
              type="number"
              id="maxAnnualLeaveDays"
              name="maxAnnualLeaveDays"
              value="12"
              min="0"
              max="365"
              required
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label for="maxSickLeaveDays" class="block text-sm font-medium text-text mb-1">
              {m.school_leave_max_sick?.() ?? 'Max Sick Leave Days'}
            </label>
            <input
              type="number"
              id="maxSickLeaveDays"
              name="maxSickLeaveDays"
              value="14"
              min="0"
              max="365"
              required
              class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? m.school_leave_settings_saving?.() ?? 'Saving...' : m.school_leave_settings_save?.() ?? 'Save'}
        </Button>
      </form>
      <div class="flex gap-3 mt-6">
        <Button variant="ghost" onclick={() => (currentStep = 4)}>
          {m.onboarding_back?.() ?? 'Back'}
        </Button>
        <form method="POST" action="?/completeOnboarding">
          <Button type="submit">{m.onboarding_finish?.() ?? 'Finish Setup'}</Button>
        </form>
      </div>
    {/if}
  </div>
</div>
