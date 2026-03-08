<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Input, Alert } from '$lib/components/ui';

  let { form } = $props();
  let loading = $state(false);
</script>

<svelte:head>
  <title>Accept Invitation — GrewMe</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-primary mb-2">GrewMe</h1>
      <p class="text-text-muted">You've been invited to join as a teacher</p>
    </div>

    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-8">
      <h2 class="text-xl font-semibold text-text mb-6">Create Your Account</h2>

      {#if form?.error}
        <Alert variant="error">{form.error}</Alert>
      {/if}

      {#if form?.success}
        <Alert variant="success">Account created! Redirecting...</Alert>
      {:else}
        <form method="POST" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); }; }} class="space-y-4">
          <Input label="Full Name" type="text" name="name" required placeholder="Your name" />
          <Input label="Password" type="password" name="password" required placeholder="••••••••" />
          <Input label="Confirm Password" type="password" name="passwordConfirmation" required placeholder="••••••••" />
          <Button type="submit" {loading} class="w-full">Accept & Create Account</Button>
        </form>
      {/if}

      <div class="mt-4 text-center text-xs text-text-muted">
        <a href="/privacy" class="hover:underline">Privacy Policy</a>
        <span class="mx-2">·</span>
        <a href="/terms" class="hover:underline">Terms of Service</a>
      </div>
    </div>
  </div>
</div>
