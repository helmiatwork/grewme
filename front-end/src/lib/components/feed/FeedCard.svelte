<script lang="ts">
  import { Card, Badge } from '$lib/components/ui';
  import MediaGallery from './MediaGallery.svelte';
  import CommentSection from './CommentSection.svelte';
  import type { FeedPost, MediaAttachment } from '$lib/api/types';
  import { formatDate } from '$lib/utils/helpers';

  interface Props {
    post: FeedPost;
    onLike?: (id: string) => void;
    onComment?: (id: string, body: string) => void;
    onShare?: (id: string) => void;
  }

  let { post, onLike, onComment, onShare }: Props = $props();
  let showComments = $state(false);

  function isMedia(ct: string) {
    return ct.startsWith('image/') || ct.startsWith('video/');
  }

  const mediaUrls = $derived(
    (post.mediaAttachments ?? []).filter((a) => isMedia(a.contentType)).map((a) => a.url)
  );

  const documentAttachments = $derived(
    (post.mediaAttachments ?? []).filter((a) => !isMedia(a.contentType))
  );

  function fileIcon(contentType: string): string {
    if (contentType === 'application/pdf') return '📄';
    if (contentType.includes('spreadsheet') || contentType.includes('excel')) return '📊';
    if (contentType.includes('presentation') || contentType.includes('powerpoint')) return '📽️';
    if (contentType.includes('word') || contentType.includes('document')) return '📝';
    if (contentType.startsWith('text/')) return '📃';
    return '📎';
  }

  function fileExtension(filename: string): string {
    return filename.split('.').pop()?.toUpperCase() ?? '';
  }
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
        {#if post.taggedStudents?.length > 0}
          <span class="text-primary">·</span>
          {#each post.taggedStudents as student}
            <span class="text-primary font-medium">@{student.name}</span>
          {/each}
        {/if}
      </div>
    </div>
  </div>

  <!-- Body -->
  <p class="text-text mb-3 whitespace-pre-wrap">{post.body}</p>

  <!-- Media (images & videos only) -->
  {#if mediaUrls.length > 0}
    <MediaGallery urls={mediaUrls} />
  {/if}

  <!-- Document attachments -->
  {#if documentAttachments.length > 0}
    <div class="mb-3 space-y-1.5">
      {#each documentAttachments as attachment}
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          download={attachment.filename}
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-colors group"
        >
          <span class="text-lg flex-shrink-0">{fileIcon(attachment.contentType)}</span>
          <span class="flex-1 min-w-0">
            <span class="block text-sm font-medium text-text truncate">{attachment.filename}</span>
            <span class="block text-xs text-text-muted">{fileExtension(attachment.filename)}</span>
          </span>
          <svg class="w-4 h-4 text-slate-400 group-hover:text-primary flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </a>
      {/each}
    </div>
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
