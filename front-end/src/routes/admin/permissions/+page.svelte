<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { Card, Button, Alert, Badge } from '$lib/components/ui';

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
  <h1 class="text-2xl font-bold text-text mb-6">Permission Management</h1>

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
      <h2 class="text-lg font-semibold text-text">Look Up User</h2>
    {/snippet}
    <div class="flex gap-3 items-end">
      <div class="flex-1 space-y-1">
        <label class="block text-sm font-medium text-text" for="userId">User ID</label>
        <input
          id="userId"
          type="text"
          bind:value={userId}
          placeholder="Enter user ID..."
          class="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>
      <div class="space-y-1">
        <label class="block text-sm font-medium text-text" for="userType">Type</label>
        <select
          id="userType"
          bind:value={userType}
          class="px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="Teacher">Teacher</option>
          <option value="Parent">Parent</option>
        </select>
      </div>
      <Button onclick={lookupUser}>Look Up</Button>
    </div>
  </Card>

  <!-- Permissions Table -->
  {#if permissions}
    <Card>
      {#snippet header()}
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-text">
            Permissions for User #{permissions.userId}
          </h2>
          <Badge variant="primary">{permissions.role}</Badge>
        </div>
      {/snippet}

      <h3 class="text-sm font-semibold text-text-muted mb-3 mt-2">Effective Permissions</h3>
      <div class="overflow-x-auto -mx-6">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-100">
              <th class="text-left px-6 py-2 text-sm font-medium text-text-muted">Resource</th>
              <th class="text-left px-6 py-2 text-sm font-medium text-text-muted">Action</th>
              <th class="text-left px-6 py-2 text-sm font-medium text-text-muted">Granted</th>
              <th class="text-left px-6 py-2 text-sm font-medium text-text-muted">Source</th>
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
        <h3 class="text-sm font-semibold text-text-muted mb-3 mt-6">Permission Overrides</h3>
        <div class="space-y-2">
          {#each permissions.overrides as override}
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <span class="text-sm font-medium text-text">{override.resource}.{override.action}</span>
                <Badge variant={override.granted ? 'success' : 'danger'} class="ml-2">
                  {override.granted ? 'Granted' : 'Revoked'}
                </Badge>
              </div>
              <div class="flex gap-2">
                <form method="POST" action="?/toggle" use:enhance>
                  <input type="hidden" name="id" value={override.id} />
                  <Button variant="outline" size="sm" type="submit">Toggle</Button>
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
