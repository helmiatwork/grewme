<script lang="ts">
  import { Card, Button, Alert } from '$lib/components/ui';
  import { FeedCard } from '$lib/components/feed';

  let { data, form } = $props();
</script>

<svelte:head>
  <title>Class Feed — GrewMe</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold text-text mb-6">Class Feed</h1>

  <!-- Create Post Form -->
  <Card class="mb-8">
    {#snippet children()}
      <h2 class="text-lg font-semibold text-text mb-4">Create Post</h2>

      {#if form?.error}
        <Alert variant="error">{form.error}</Alert>
      {/if}

      <form method="POST" class="space-y-4">
        <div>
          <label for="classroomId" class="block text-sm font-medium text-text mb-1">Classroom</label>
          <select
            name="classroomId"
            id="classroomId"
            required
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Select classroom...</option>
            {#each data.classrooms as classroom}
              <option value={classroom.id}>{classroom.name}</option>
            {/each}
          </select>
        </div>

        <div>
          <label for="body" class="block text-sm font-medium text-text mb-1">Message</label>
          <textarea
            name="body"
            id="body"
            required
            rows={4}
            placeholder="Share an update with parents..."
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          ></textarea>
        </div>

        <Button type="submit">Post Update</Button>
      </form>
    {/snippet}
  </Card>

  <!-- Recent Posts -->
  <h2 class="text-lg font-semibold text-text mb-4">Recent Posts</h2>

  {#if data.feedPosts.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p>No posts yet. Create your first update above!</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each data.feedPosts as post (post.id)}
        <FeedCard {post} />
      {/each}
    </div>
  {/if}
</div>
