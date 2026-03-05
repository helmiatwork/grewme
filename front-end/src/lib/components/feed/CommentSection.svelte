<script lang="ts">
  import type { FeedPostComment } from '$lib/api/types';
  import { formatDate } from '$lib/utils/helpers';

  interface Props {
    postId: string;
    comments: FeedPostComment[];
    onComment?: (id: string, body: string) => void;
  }

  let { postId, comments, onComment }: Props = $props();
  let newComment = $state('');

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    if (newComment.trim() && onComment) {
      onComment(postId, newComment.trim());
      newComment = '';
    }
  }
</script>

<div class="mt-3 pt-3 border-t border-slate-100 space-y-3">
  {#each comments as comment}
    <div class="flex gap-2">
      <div class="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
        {comment.commenterName.charAt(0)}
      </div>
      <div class="flex-1 bg-slate-50 rounded-lg px-3 py-2">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-text">{comment.commenterName}</span>
          <span class="text-xs text-text-muted">{formatDate(comment.createdAt)}</span>
        </div>
        <p class="text-sm text-text mt-0.5">{comment.body}</p>
      </div>
    </div>
  {/each}

  <!-- New comment input -->
  <form class="flex gap-2" onsubmit={handleSubmit}>
    <input
      type="text"
      bind:value={newComment}
      placeholder="Write a comment..."
      class="flex-1 text-sm border border-slate-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
    <button
      type="submit"
      disabled={!newComment.trim()}
      class="text-sm font-semibold text-primary disabled:text-slate-300 px-3"
    >
      Post
    </button>
  </form>
</div>
