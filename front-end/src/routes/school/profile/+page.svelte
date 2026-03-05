<script lang="ts">
  import { Card } from '$lib/components/ui';

  let { data } = $props();
</script>

<svelte:head>
  <title>Profile — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">My Profile</h1>

  <div class="max-w-lg">
    <Card>
      {#snippet children()}
        <div class="space-y-4">
          <div class="flex items-center gap-4">
            {#if data.profile.avatarUrl}
              <img src={data.profile.avatarUrl} alt="Avatar" class="w-16 h-16 rounded-full object-cover" />
            {:else}
              <div class="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-2xl font-bold text-amber-700">
                {data.profile.name.charAt(0)}
              </div>
            {/if}
            <div>
              <h2 class="text-xl font-semibold text-text">{data.profile.name}</h2>
              <p class="text-sm text-text-muted">{data.profile.email}</p>
              <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">School Manager</span>
            </div>
          </div>
        </div>
      {/snippet}
    </Card>
  </div>
</div>
