<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Input, Alert } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { form } = $props();
  let loading = $state(false);
</script>

<svelte:head>
  <title>{m.invite_page_title()}</title>
</svelte:head>

<div class="min-h-screen bg-background flex items-center justify-center p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-primary mb-2">{m.app_name()}</h1>
      <p class="text-text-muted">{m.invite_subtitle()}</p>
    </div>

    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-8">
      <h2 class="text-xl font-semibold text-text mb-6">{m.invite_create_account()}</h2>

      {#if form?.error}
        <Alert variant="error">{form.error}</Alert>
      {/if}

      {#if form?.success}
        <Alert variant="success">{m.invite_account_created()}</Alert>
      {:else}
        <form method="POST" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); }; }} class="space-y-4">
          <Input label={m.invite_full_name()} type="text" name="name" required placeholder={m.invite_full_name_placeholder()} />
          <Input label={m.common_password()} type="password" name="password" required placeholder="••••••••" />
          <Input label={m.invite_confirm_password()} type="password" name="passwordConfirmation" required placeholder="••••••••" />
          <Button type="submit" {loading} class="w-full">{m.invite_accept_btn()}</Button>
        </form>
      {/if}

      <div class="mt-4 text-center text-xs text-text-muted">
        <a href="/privacy" class="hover:underline">{m.login_privacy()}</a>
        <span class="mx-2">·</span>
        <a href="/terms" class="hover:underline">{m.login_terms()}</a>
      </div>
    </div>
  </div>
</div>
