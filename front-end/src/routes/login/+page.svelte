<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Input, Alert } from '$lib/components/ui';

  let { form } = $props();
  let loading = $state(false);
</script>

<svelte:head>
  <title>Login — GrewMe</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-primary mb-2">GrewMe</h1>
      <p class="text-text-muted">Kids Learning Radar</p>
    </div>

    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-8">
      <h2 class="text-xl font-semibold text-text mb-6">Sign in to your account</h2>

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

        <div class="space-y-1">
          <label class="block text-sm font-medium text-text">I am a...</label>
          <div class="flex gap-3">
            <label class="flex-1">
              <input type="radio" name="role" value="teacher" checked={form?.role !== 'parent'} class="peer sr-only" />
              <div class="text-center py-2 px-4 rounded-lg border-2 border-slate-200 cursor-pointer
                peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary
                transition-colors text-sm font-medium">
                Teacher
              </div>
            </label>
            <label class="flex-1">
              <input type="radio" name="role" value="parent" checked={form?.role === 'parent'} class="peer sr-only" />
              <div class="text-center py-2 px-4 rounded-lg border-2 border-slate-200 cursor-pointer
                peer-checked:border-secondary peer-checked:bg-secondary/5 peer-checked:text-secondary
                transition-colors text-sm font-medium">
                Parent
              </div>
            </label>
          </div>
        </div>

        <Button type="submit" {loading} class="w-full">
          Sign in
        </Button>
      </form>

      <p class="mt-6 text-center text-sm text-text-muted">
        Don't have an account?
        <a href="/register" class="text-primary hover:underline font-medium">Register</a>
      </p>
    </div>
  </div>
</div>
