<script lang="ts">
  import { Card, Badge } from '$lib/components/ui';
  import MediaGallery from './MediaGallery.svelte';
  import CommentSection from './CommentSection.svelte';
  import type { FeedPost } from '$lib/api/types';
  import { formatDate } from '$lib/utils/helpers';

  interface Props {
    post: FeedPost;
    onLike?: (id: string) => void;
    onComment?: (id: string, body: string) => void;
    onShare?: (id: string) => void;
  }

  let { post, onLike, onComment, onShare }: Props = $props();
  let showComments = $state(false);
</script>

<Card>
  <!-- Header -->
  <div class="flex items-center gap-3 mb-3">
    <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
      {post.teacher.name.charAt(0)}
    </div>
    <div class="flex-1">
      <p class="font-semibold text-text">{post.teacher.name}</p>
      <div class="flex items-center gap-2 text-xs text-text-muted">
        <span>{formatDate(post.createdAt)}</span>
        <Badge>{post.classroom.name}</Badge>
      </div>
    </div>
  </div>

  <!-- Body -->
  <p class="text-text mb-3 whitespace-pre-wrap">{post.body}</p>

  <!-- Media -->
  {#if post.mediaUrls && post.mediaUrls.length > 0}
    <MediaGallery urls={post.mediaUrls} />
  {/if}

  <!-- Actions -->
  <div class="flex items-center gap-4 pt-3 border-t border-slate-100">
    <button
      class="flex items-center gap-1.5 text-sm transition-colors {post.likedByMe ? 'text-rose-500 font-semibold' : 'text-text-muted hover:text-rose-500'}"
      onclick={() => onLike?.(post.id)}
    >
      <span>{post.likedByMe ? '❤️' : '🤍'}</span>
      <span>{post.likesCount}</span>
    </button>

    <button
      class="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
      onclick={() => showComments = !showComments}
    >
      <span>💬</span>
      <span>{post.commentsCount}</span>
    </button>

    <button
      class="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
      onclick={() => onShare?.(post.id)}
    >
      <span>🔗</span>
      <span>Share</span>
    </button>
  </div>

  <!-- Comments -->
  {#if showComments}
    <CommentSection
      postId={post.id}
      comments={post.comments ?? []}
      {onComment}
    />
  {/if}
</Card>
