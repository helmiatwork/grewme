<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Input, Alert } from '$lib/components/ui';
  import { getLocale, setLocale } from '$lib/paraglide/runtime.js';

  let { form } = $props();
  let loading = $state(false);
  let showPassword = $state(false);
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

        <div class="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            id="password"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onclick={() => showPassword = !showPassword}
            class="absolute right-3 top-[34px] text-text-muted hover:text-text transition-colors"
            tabindex={-1}
          >
            {#if showPassword}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {/if}
          </button>
        </div>

        <div class="space-y-1">
          <label class="block text-sm font-medium text-text">I am a...</label>
          <div class="flex gap-3">
            <label class="flex-1">
              <input type="radio" name="role" value="teacher" checked={!form?.role || form?.role === 'teacher'} class="peer sr-only" />
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
            <label class="flex-1">
              <input type="radio" name="role" value="school_manager" checked={form?.role === 'school_manager'} class="peer sr-only" />
              <div class="text-center py-2 px-4 rounded-lg border-2 border-slate-200 cursor-pointer
                peer-checked:border-amber-600 peer-checked:bg-amber-50 peer-checked:text-amber-700
                transition-colors text-sm font-medium">
                School
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
      <div class="mt-4 text-center text-xs text-text-muted">
        <a href="/privacy" class="hover:underline">Privacy Policy</a>
        <span class="mx-2">·</span>
        <a href="/terms" class="hover:underline">Terms of Service</a>
      </div>
      <div class="mt-2 text-center">
        <select
          value={getLocale()}
          onchange={(e) => setLocale(e.currentTarget.value as "en" | "id")}
          class="text-xs bg-transparent border border-slate-200 rounded px-2 py-0.5 text-text-muted"
        >
          <option value="en">🇬🇧 EN</option>
          <option value="id">🇮🇩 ID</option>
        </select>
      </div>
    </div>
  </div>
</div>
