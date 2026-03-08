<script lang="ts">
  import { enhance } from '$app/forms';
  import { Button, Alert } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data, form } = $props();
  let loading = $state(false);
  let showDeleteConfirm = $state(false);
</script>

<svelte:head>
  <title>Data Rights — GrewMe</title>
</svelte:head>

<div class="max-w-4xl mx-auto py-8 px-4">
  <h1 class="text-2xl font-bold text-text mb-6">{m.data_rights_title()}</h1>

  {#if form?.error}
    <Alert variant="error">{form.error}</Alert>
  {/if}

  {#if form?.success}
    <Alert variant="success">{form.success}</Alert>
  {/if}

  <!-- Consent Status -->
  <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
    <h2 class="text-lg font-semibold text-text mb-4">{m.data_rights_consent_status()}</h2>
    {#if data.consents?.length > 0}
      <div class="space-y-3">
        {#each data.consents as consent}
          <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p class="font-medium text-text">{consent.studentName}</p>
              <p class="text-sm text-text-muted">{m.data_rights_status_label()} <span class="font-medium">{consent.status}</span></p>
            </div>
            {#if consent.status === 'granted'}
              <form method="POST" action="?/revokeConsent">
                <input type="hidden" name="consentId" value={consent.id} />
                <Button type="submit" variant="outline" size="sm">{m.data_rights_revoke()}</Button>
              </form>
            {/if}
          </div>
        {/each}
      </div>
    {:else}
      <p class="text-text-muted">{m.data_rights_no_consents()}</p>
    {/if}
  </div>

  <!-- Export Data -->
  <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
    <h2 class="text-lg font-semibold text-text mb-4">{m.data_rights_export_title()}</h2>
    <p class="text-text-muted mb-4">{m.data_rights_export_hint()}</p>
    {#if data.consents?.length > 0}
      {#each data.consents as consent}
        {#if consent.status === 'granted'}
          <form method="POST" action="?/exportData" class="mb-2">
            <input type="hidden" name="studentId" value={consent.id} />
            <Button type="submit" variant="outline">{m.data_rights_export_btn({ name: consent.studentName })}</Button>
          </form>
        {/if}
      {/each}
    {/if}

    {#if form?.exportData}
      <div class="mt-4 p-4 bg-slate-50 rounded-lg">
        <p class="text-sm font-medium text-text mb-2">{m.data_rights_exported_label()}</p>
        <pre class="text-xs text-text-muted overflow-auto max-h-64">{JSON.stringify(form.exportData, null, 2)}</pre>
        <Button onclick={() => {
          const blob = new Blob([JSON.stringify(form.exportData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'child-data-export.json';
          a.click();
        }} variant="outline" class="mt-2">{m.data_rights_download_json()}</Button>
      </div>
    {/if}
  </div>

  <!-- Delete Account -->
  <div class="bg-surface rounded-xl shadow-sm border border-slate-100 p-6">
    <h2 class="text-lg font-semibold text-text mb-4">{m.data_rights_delete_title()}</h2>
    <p class="text-text-muted mb-4">{m.data_rights_delete_hint()}</p>

    {#if showDeleteConfirm}
      <form method="POST" action="?/deleteAccount" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; showDeleteConfirm = false; await update(); }; }}>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p class="text-sm text-red-700 font-medium">{m.data_rights_delete_warning()}</p>
        </div>
        <textarea name="reason" placeholder={m.data_rights_reason_placeholder()} class="w-full p-3 border border-slate-200 rounded-lg text-sm mb-3" rows="2"></textarea>
        <div class="flex gap-3">
          <Button type="submit" {loading} variant="danger">{m.data_rights_confirm_delete()}</Button>
          <Button type="button" variant="outline" onclick={() => showDeleteConfirm = false}>{m.common_cancel()}</Button>
        </div>
      </form>
    {:else}
      <Button onclick={() => showDeleteConfirm = true} variant="danger">{m.data_rights_request_delete()}</Button>
    {/if}
  </div>
</div>
