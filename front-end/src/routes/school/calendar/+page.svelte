<script lang="ts">
  import { Card } from '$lib/components/ui';

  let { data } = $props();
</script>

<svelte:head>
  <title>Calendar — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">School Calendar</h1>

  {#if data.events.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">No events this month</p>
    </div>
  {:else}
    <div class="space-y-3 max-w-2xl">
      {#each data.events as event}
        <Card>
          {#snippet children()}
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-semibold text-text">{event.title}</h3>
                <p class="text-sm text-text-muted">
                  {new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  {#if event.startTime} &middot; {event.startTime}{/if}
                  {#if event.endTime} - {event.endTime}{/if}
                </p>
                <p class="text-xs text-text-muted mt-1">{event.classroom.name} &middot; by {event.creatorName}</p>
              </div>
            </div>
            {#if event.description}
              <p class="text-sm text-text mt-2">{event.description}</p>
            {/if}
          {/snippet}
        </Card>
      {/each}
    </div>
  {/if}
</div>
