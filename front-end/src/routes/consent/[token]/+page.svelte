<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Input, Alert } from '$lib/components/ui';

  let { form } = $props();
  let loading = $state(false);
  let action = $state<'grant' | 'decline' | null>(null);
</script>

<svelte:head>
  <title>Parental Consent — GrewMe</title>
</svelte:head>

<div class="min-h-screen bg-background py-8 px-4">
  <div class="max-w-2xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-primary mb-2">GrewMe</h1>
      <p class="text-text-muted">Parental Consent Required</p>
    </div>

    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-8">
      {#if form?.error}
        <Alert variant="error">{form.error}</Alert>
      {/if}

      {#if form?.declined}
        <div class="text-center py-8">
          <h2 class="text-xl font-semibold text-text mb-2">Consent Declined</h2>
          <p class="text-text-muted">You have declined consent. No data will be collected about your child.</p>
        </div>
      {:else if form?.success}
        <Alert variant="success">Consent granted! Your account has been created. Redirecting...</Alert>
      {:else}
        <!-- COPPA Direct Notice -->
        <h2 class="text-xl font-semibold text-text mb-4">Notice of Data Collection</h2>
        <p class="text-text-muted mb-4">A teacher has requested to add your child to GrewMe, an educational learning platform. Before we can collect any information about your child, we need your consent.</p>

        <div class="space-y-4 mb-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <h3 class="font-semibold text-text mb-2">What We Collect</h3>
            <ul class="text-sm text-text-muted list-disc pl-5 space-y-1">
              <li>Student name</li>
              <li>Daily learning scores and skill assessments</li>
              <li>Classroom participation data</li>
            </ul>
          </div>

          <div class="bg-green-50 rounded-lg p-4">
            <h3 class="font-semibold text-text mb-2">How We Use It</h3>
            <p class="text-sm text-text-muted">Solely for educational purposes: tracking learning progress, generating skill radar charts, and providing feedback to teachers and parents. We do NOT use data for advertising.</p>
          </div>

          <div class="bg-purple-50 rounded-lg p-4">
            <h3 class="font-semibold text-text mb-2">Who Has Access</h3>
            <p class="text-sm text-text-muted">Only assigned teachers, school administrators, and you (the parent/guardian).</p>
          </div>

          <div class="bg-amber-50 rounded-lg p-4">
            <h3 class="font-semibold text-text mb-2">Your Rights</h3>
            <p class="text-sm text-text-muted">You may review, export, request deletion of, or refuse further collection of your child's data at any time from your parent dashboard.</p>
          </div>
        </div>

        <p class="text-sm text-text-muted mb-6">
          By granting consent, you agree to our <a href="/privacy" class="text-primary hover:underline">Privacy Policy</a>.
        </p>

        <!-- Grant form -->
        {#if action === 'grant'}
          <form method="POST" action="?/grant" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); }; }} class="space-y-4">
            <h3 class="font-semibold text-text">Create Your Parent Account</h3>
            <Input label="Full Name" type="text" name="name" required placeholder="Your name" />
            <Input label="Password" type="password" name="password" required placeholder="••••••••" />
            <Input label="Confirm Password" type="password" name="passwordConfirmation" required placeholder="••••••••" />
            <div class="flex gap-3">
              <Button type="submit" {loading} class="flex-1">Grant Consent & Create Account</Button>
              <Button type="button" variant="outline" onclick={() => action = null} class="flex-1">Back</Button>
            </div>
          </form>
        {:else}
          <div class="flex gap-3">
            <Button onclick={() => action = 'grant'} class="flex-1">Grant Consent</Button>
            <form method="POST" action="?/decline" class="flex-1">
              <Button type="submit" variant="outline" class="w-full">Decline</Button>
            </form>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
