<script lang="ts">
  import type { PageData } from './$types';
  import { Card } from '$lib/components/ui';
  import { formatDate } from '$lib/utils/helpers';

  let { data }: { data: PageData } = $props();

  const conversations = $derived(data.conversations ?? []);
</script>

<div class="p-4">
  <h1 class="text-2xl font-bold mb-4">Messages</h1>

  {#if conversations.length === 0}
    <div class="flex items-center justify-center h-40 text-muted-foreground">
      No conversations yet
    </div>
  {:else}
    <div class="flex flex-col gap-3">
      {#each conversations as conversation (conversation.id)}
        <a href="/parent/messages/{conversation.id}" class="block">
          <Card class="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div class="flex items-center gap-3">
              <!-- Avatar -->
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                {conversation.teacher?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>

              <!-- Middle: names + last message -->
              <div class="flex-1 min-w-0">
                <p class="font-bold text-sm truncate">{conversation.teacher?.name ?? 'Unknown Teacher'}</p>
                <p class="text-xs text-muted-foreground truncate">{conversation.student?.name ?? ''}</p>
                {#if conversation.lastMessage}
                  <p class="text-xs text-muted-foreground truncate mt-0.5">
                    {conversation.lastMessage.body}
                  </p>
                {/if}
              </div>

              <!-- Right: time + unread badge -->
              <div class="flex-shrink-0 flex flex-col items-end gap-1">
                {#if conversation.lastMessage?.createdAt}
                  <span class="text-xs text-muted-foreground">
                    {formatDate(conversation.lastMessage.createdAt)}
                  </span>
                {/if}
                {#if conversation.unreadCount > 0}
                  <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">
                    {conversation.unreadCount}
                  </span>
                {/if}
              </div>
            </div>
          </Card>
        </a>
      {/each}
    </div>
  {/if}
</div>
