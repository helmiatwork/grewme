<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { Card, Button, Alert, Badge } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data, form } = $props();
  let userId = $state('');
  let userType = $state('Teacher');
  const permissions = $derived(data.permissions);

  function lookupUser() {
    if (userId) {
      goto(`/admin/permissions?userId=${userId}&userType=${userType}`, { replaceState: true });
    }
  }
</script>

<svelte:head>
  <title>Permissions — GrewMe</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
  <h1 class="text-2xl font-bold text-text mb-6">{m.admin_permissions_title()}</h1>

  {#if form?.success}
    <div class="mb-4">
      <Alert variant="success">{form.success}</Alert>
    </div>
  {/if}

  {#if form?.error || data.error}
    <div class="mb-4">
      <Alert variant="error">{form?.error || data.error}</Alert>
    </div>
  {/if}

  <!-- User Lookup -->
  <Card class="mb-6">
    {#snippet header()}
      <h2 class="text-lg font-semibold text-text">{m.admin_permissions_lookup_title()}</h2>
    {/snippet}
    <div class="flex gap-3 items-end">
      <div class="flex-1 space-y-1">
        <label class="block text-sm font-medium text-text" for="userId">{m.admin_permissions_user_id()}</label>
        <input
          id="userId"
          type="text"
          bind:value={userId}
          placeholder={m.admin_permissions_user_id_placeholder()}
          class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div class="space-y-1">
        <label class="block text-sm font-medium text-text" for="userType">{m.admin_permissions_user_type()}</label>
        <select
          id="userType"
          bind:value={userType}
          class="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="Teacher">Teacher</option>
          <option value="Parent">Parent</option>
        </select>
      </div>
      <Button onclick={lookupUser}>{m.admin_permissions_lookup_btn()}</Button>
    </div>
  </Card>

  <!-- Permissions Table -->
  {#if permissions}
    <Card>
      {#snippet header()}
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-text">
            {m.admin_permissions_for_user({ id: String(permissions.userId) })}
          </h2>
          <Badge variant="primary">{permissions.role}</Badge>
        </div>
      {/snippet}

      <h3 class="text-sm font-semibold text-text-muted mb-3 mt-2">{m.admin_permissions_effective()}</h3>
      <div class="overflow-x-auto -mx-6">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100">
              <th class="text-left px-6 py-2 text-sm font-medium text-text-muted">{m.admin_permissions_col_resource()}</th>
              <th class="text-left px-6 py-2 text-sm font-medium text-text-muted">{m.admin_permissions_col_action()}</th>
              <th class="text-left px-6 py-2 text-sm font-medium text-text-muted">{m.admin_permissions_col_granted()}</th>
              <th class="text-left px-6 py-2 text-sm font-medium text-text-muted">{m.admin_permissions_col_source()}</th>
            </tr>
          </thead>
          <tbody>
            {#each permissions.effective as perm}
              <tr class="border-b border-slate-50">
                <td class="px-6 py-2 text-sm text-text">{perm.resource}</td>
                <td class="px-6 py-2 text-sm text-text">{perm.action}</td>
                <td class="px-6 py-2">
                  <Badge variant={perm.granted ? 'success' : 'danger'}>
                    {perm.granted ? 'Yes' : 'No'}
                  </Badge>
                </td>
                <td class="px-6 py-2 text-sm text-text-muted">{perm.source}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      {#if permissions.overrides.length > 0}
        <h3 class="text-sm font-semibold text-text-muted mb-3 mt-6">{m.admin_permissions_overrides()}</h3>
        <div class="space-y-2">
          {#each permissions.overrides as override}
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <span class="text-sm font-medium text-text">{override.resource}.{override.action}</span>
                <Badge variant={override.granted ? 'success' : 'danger'} class="ml-2">
                  {override.granted ? m.admin_permissions_granted() : m.admin_permissions_revoked()}
                </Badge>
              </div>
              <div class="flex gap-2">
                <form method="POST" action="?/toggle" use:enhance>
                  <input type="hidden" name="id" value={override.id} />
                  <Button variant="outline" size="sm" type="submit">{m.admin_permissions_toggle()}</Button>
                </form>
                <form method="POST" action="?/delete" use:enhance>
                  <input type="hidden" name="id" value={override.id} />
                  <Button variant="danger" size="sm" type="submit">Delete</Button>
                </form>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Card>
  {/if}
</div>
