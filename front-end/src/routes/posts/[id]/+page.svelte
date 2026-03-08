<script lang="ts">
  import { Card, Badge } from '$lib/components/ui';
  import { MediaGallery } from '$lib/components/feed';
  import { formatDate } from '$lib/utils/helpers';
  import * as m from '$lib/paraglide/messages.js';

  let { data } = $props();
  const post = data.post;
</script>

<svelte:head>
  <title>{post.teacher.name} — GrewMe</title>
  <meta property="og:title" content="{post.teacher.name} posted on GrewMe" />
  <meta property="og:description" content="{post.body.slice(0, 200)}" />
  <meta property="og:type" content="article" />
</svelte:head>

<div class="max-w-2xl mx-auto py-8 px-4">
  <div class="mb-4">
    <a href="/" class="text-sm text-primary hover:underline">{m.post_back()}</a>
  </div>

  <Card>
    {#snippet children()}
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
          {post.teacher.name.charAt(0)}
        </div>
        <div>
          <p class="font-semibold text-text text-lg">{post.teacher.name}</p>
          <div class="flex items-center gap-2 text-sm text-text-muted">
            <span>{formatDate(post.createdAt)}</span>
            <Badge>{post.classroom.name}</Badge>
          </div>
        </div>
      </div>

      <p class="text-text text-lg mb-4 whitespace-pre-wrap">{post.body}</p>

      {#if post.mediaUrls && post.mediaUrls.length > 0}
        <MediaGallery urls={post.mediaUrls} />
      {/if}

      <div class="flex items-center gap-4 pt-3 border-t border-slate-100 text-sm text-text-muted">
        <span>❤️ {post.likesCount} likes</span>
        <span>💬 {post.commentsCount} comments</span>
      </div>

      {#if post.comments && post.comments.length > 0}
        <div class="mt-4 pt-3 border-t border-slate-100 space-y-3">
          {#each post.comments as comment}
            <div class="flex gap-2">
              <div class="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                {comment.commenterName.charAt(0)}
              </div>
              <div class="bg-slate-50 rounded-lg px-3 py-2 flex-1">
                <span class="text-sm font-semibold text-text">{comment.commenterName}</span>
                <span class="text-xs text-text-muted ml-2">{formatDate(comment.createdAt)}</span>
                <p class="text-sm text-text mt-0.5">{comment.body}</p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/snippet}
  </Card>
</div>
