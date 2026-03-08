<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Input, Alert } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { form } = $props();
  let loading = $state(false);
  let action = $state<'grant' | 'decline' | null>(null);
</script>

<svelte:head>
  <title>{m.consent_page_title()}</title>
</svelte:head>

<div class="min-h-screen bg-background py-8 px-4">
  <div class="max-w-2xl mx-auto">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-primary mb-2">{m.app_name()}</h1>
      <p class="text-text-muted">{m.consent_subtitle()}</p>
    </div>

    <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-8">
      {#if form?.error}
        <Alert variant="error">{form.error}</Alert>
      {/if}

      {#if form?.declined}
        <div class="text-center py-8">
          <h2 class="text-xl font-semibold text-text mb-2">{m.consent_declined_title()}</h2>
          <p class="text-text-muted">{m.consent_declined_body()}</p>
        </div>
      {:else if form?.success}
        <Alert variant="success">{m.consent_granted_alert()}</Alert>
      {:else}
        <!-- COPPA Direct Notice -->
        <h2 class="text-xl font-semibold text-text mb-4">{m.consent_notice_title()}</h2>
        <p class="text-text-muted mb-4">{m.consent_notice_body()}</p>

        <div class="space-y-4 mb-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <h3 class="font-semibold text-text mb-2">{m.consent_collect_title()}</h3>
            <ul class="text-sm text-text-muted list-disc pl-5 space-y-1">
              <li>{m.consent_collect_li1()}</li>
              <li>{m.consent_collect_li2()}</li>
              <li>{m.consent_collect_li3()}</li>
            </ul>
          </div>

          <div class="bg-green-50 rounded-lg p-4">
            <h3 class="font-semibold text-text mb-2">{m.consent_use_title()}</h3>
            <p class="text-sm text-text-muted">{m.consent_use_body()}</p>
          </div>

          <div class="bg-purple-50 rounded-lg p-4">
            <h3 class="font-semibold text-text mb-2">{m.consent_access_title()}</h3>
            <p class="text-sm text-text-muted">{m.consent_access_body()}</p>
          </div>

          <div class="bg-amber-50 rounded-lg p-4">
            <h3 class="font-semibold text-text mb-2">{m.consent_rights_title()}</h3>
            <p class="text-sm text-text-muted">{m.consent_rights_body()}</p>
          </div>
        </div>

        <p class="text-sm text-text-muted mb-6">
          {m.consent_privacy_agree()} <a href="/privacy" class="text-primary hover:underline">{m.login_privacy()}</a>.
        </p>

        <!-- Grant form -->
        {#if action === 'grant'}
          <form method="POST" action="?/grant" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); }; }} class="space-y-4">
            <h3 class="font-semibold text-text">{m.consent_create_account()}</h3>
            <Input label={m.register_name()} type="text" name="name" required placeholder="Your name" />
            <Input label={m.common_password()} type="password" name="password" required placeholder="••••••••" />
            <Input label={m.register_confirm_password()} type="password" name="passwordConfirmation" required placeholder="••••••••" />
            <div class="flex gap-3">
              <Button type="submit" {loading} class="flex-1">{m.consent_grant_btn()}</Button>
              <Button type="button" variant="outline" onclick={() => action = null} class="flex-1">{m.common_back()}</Button>
            </div>
          </form>
        {:else}
          <div class="flex gap-3">
            <Button onclick={() => action = 'grant'} class="flex-1">{m.consent_grant_action()}</Button>
            <form method="POST" action="?/decline" class="flex-1">
              <Button type="submit" variant="outline" class="w-full">{m.consent_decline_btn()}</Button>
            </form>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>
