<script lang="ts">
  import { Card } from '$lib/components/ui';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();
</script>

<svelte:head>
  <title>Feed — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">{m.feed_title()}</h1>

  {#if data.feedPosts.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">{m.feed_no_posts()}</p>
    </div>
  {:else}
    <div class="space-y-4 max-w-2xl">
      {#each data.feedPosts as post}
        <Card>
          {#snippet children()}
            <div class="flex items-start justify-between mb-2">
              <div>
                <p class="font-semibold text-text">{post.teacher.name}</p>
                <p class="text-xs text-text-muted">{post.classroom.name} &middot; {new Date(post.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <p class="text-text whitespace-pre-wrap">{post.body}</p>
            {#if post.taggedStudents.length > 0}
              <div class="flex flex-wrap gap-1 mt-2">
                {#each post.taggedStudents as student}
                  <span class="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{student.name}</span>
                {/each}
              </div>
            {/if}
            <div class="flex gap-4 mt-3 text-sm text-text-muted">
              <span>{post.likesCount} likes</span>
              <span>{post.commentsCount} comments</span>
            </div>
          {/snippet}
        </Card>
      {/each}
    </div>
  {/if}
</div>
