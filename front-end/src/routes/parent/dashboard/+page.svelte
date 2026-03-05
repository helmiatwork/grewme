<script lang="ts">
  import { Card } from '$lib/components/ui';
  import { RadarChart } from '$lib/components/charts';
  import { FeedCard } from '$lib/components/feed';

  let { data } = $props();

  // Child filter for feed
  let selectedChildId = $state<string | null>(null);

  const filteredPosts = $derived(
    selectedChildId
      ? data.feedPosts.filter((p) => {
          // Show posts that either tag this child specifically, or have no tags (classroom-wide)
          if (!p.taggedStudents || p.taggedStudents.length === 0) return true;
          return p.taggedStudents.some((s: { id: string }) => s.id === selectedChildId);
        })
      : data.feedPosts
  );

  function handleLike(postId: string) {
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation($id: ID!) { likeFeedPost(id: $id) { feedPost { id likesCount likedByMe } } }',
        variables: { id: postId }
      })
    }).then(r => r.json()).then(result => {
      const updated = result.data?.likeFeedPost?.feedPost;
      if (updated) {
        const idx = data.feedPosts.findIndex((p: { id: string }) => p.id === postId);
        if (idx >= 0) {
          data.feedPosts[idx] = { ...data.feedPosts[idx], ...updated };
          data.feedPosts = [...data.feedPosts];
        }
      }
    });
  }

  function handleComment(postId: string, body: string) {
    fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'mutation($id: ID!, $body: String!) { commentOnFeedPost(id: $id, body: $body) { comment { id body commenterName commenterType createdAt } } }',
        variables: { id: postId, body }
      })
    }).then(r => r.json()).then(result => {
      const comment = result.data?.commentOnFeedPost?.comment;
      if (comment) {
        const idx = data.feedPosts.findIndex((p: { id: string }) => p.id === postId);
        if (idx >= 0) {
          const post = data.feedPosts[idx];
          post.comments = [...(post.comments ?? []), comment];
          post.commentsCount = (post.commentsCount ?? 0) + 1;
          data.feedPosts = [...data.feedPosts];
        }
      }
    });
  }

  function handleShare(postId: string) {
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(url);
  }
</script>

<svelte:head>
  <title>My Children — GrewMe</title>
</svelte:head>

<div>
  <h1 class="text-2xl font-bold text-text mb-6">My Children</h1>

  {#if data.children.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p class="text-lg">No children linked yet</p>
      <p class="text-sm mt-1">Ask your child's teacher to link your account.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {#each data.children as child}
        <a href="/parent/children/{child.id}">
          <Card hover>
            <h3 class="text-lg font-semibold text-text mb-3">{child.name}</h3>
            {#if child.radar}
              <RadarChart skills={child.radar} label={child.name} size="sm" />
            {:else}
              <p class="text-sm text-text-muted text-center py-8">No data yet</p>
            {/if}
          </Card>
        </a>
      {/each}
    </div>

    <!-- Feed Section -->
    <div class="mt-8">
      <h2 class="text-xl font-bold text-text mb-4">Class Feed</h2>

      <!-- Child filter tabs -->
      <div class="flex gap-2 mb-4 overflow-x-auto">
        <button
          class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors {selectedChildId === null ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted hover:bg-slate-200'}"
          onclick={() => selectedChildId = null}
        >
          All
        </button>
        {#each data.children as child}
          <button
            class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors {selectedChildId === child.id ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted hover:bg-slate-200'}"
            onclick={() => selectedChildId = child.id}
          >
            {child.name}
          </button>
        {/each}
      </div>

      <!-- Feed posts -->
      {#if filteredPosts.length === 0}
        <div class="text-center py-12 text-text-muted">
          <p class="text-lg">No posts yet</p>
          <p class="text-sm mt-1">Your child's teacher will post updates here.</p>
        </div>
      {:else}
        <div class="space-y-4">
          {#each filteredPosts as post (post.id)}
            <FeedCard
              {post}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
            />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
