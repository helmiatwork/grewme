<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Input, Alert } from '$lib/components/ui';

  let { form } = $props();
  let loading = $state(false);
  let role = $state(form?.role ?? 'teacher');
</script>

<svelte:head>
  <title>Register — GrewMe</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-primary mb-2">GrewMe</h1>
      <p class="text-text-muted">Create your account</p>
    </div>

    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-8">
      <h2 class="text-xl font-semibold text-text mb-6">Register</h2>

      {#if form?.error}
        <div class="mb-4">
          <Alert variant="error">{form.error}</Alert>
        </div>
      {/if}

      <form
        method="POST"
        use:enhance={() => {
          loading = true;
          return async ({ update }) => {
            loading = false;
            await update();
          };
        }}
        class="space-y-4"
      >
        <Input
          label="Full Name"
          type="text"
          name="name"
          id="name"
          value={form?.name ?? ''}
          placeholder="John Doe"
          required
        />

        <Input
          label="Email"
          type="email"
          name="email"
          id="email"
          value={form?.email ?? ''}
          placeholder="you@example.com"
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          id="password"
          placeholder="••••••••"
          required
        />

        <Input
          label="Confirm Password"
          type="password"
          name="passwordConfirmation"
          id="passwordConfirmation"
          placeholder="••••••••"
          required
        />

        <div class="space-y-1">
          <label class="block text-sm font-medium text-text">I am a...</label>
          <div class="flex gap-3">
            <label class="flex-1">
              <input type="radio" name="role" value="teacher" bind:group={role} class="peer sr-only" />
              <div class="text-center py-2 px-4 rounded-lg border-2 border-slate-200 cursor-pointer
                peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary
                transition-colors text-sm font-medium">
                Teacher
              </div>
            </label>
            <label class="flex-1">
              <input type="radio" name="role" value="parent" bind:group={role} class="peer sr-only" />
              <div class="text-center py-2 px-4 rounded-lg border-2 border-slate-200 cursor-pointer
                peer-checked:border-secondary peer-checked:bg-secondary/5 peer-checked:text-secondary
                transition-colors text-sm font-medium">
                Parent
              </div>
            </label>
          </div>
        </div>

        {#if role === 'parent'}
          <Input
            label="Phone Number"
            type="tel"
            name="phone"
            id="phone"
            placeholder="+62 812 3456 7890"
          />
        {/if}

        <Button type="submit" {loading} class="w-full">
          Create Account
        </Button>
      </form>

      <p class="mt-6 text-center text-sm text-text-muted">
        Already have an account?
        <a href="/login" class="text-primary hover:underline font-medium">Sign in</a>
      </p>
      <div class="mt-4 text-center text-xs text-text-muted">
        <a href="/privacy" class="hover:underline">Privacy Policy</a>
        <span class="mx-2">·</span>
        <a href="/terms" class="hover:underline">Terms of Service</a>
      </div>
    </div>
  </div>
</div>
