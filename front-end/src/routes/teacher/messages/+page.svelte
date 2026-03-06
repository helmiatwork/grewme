<script lang="ts">
  import type { PageData } from './$types';
  import { Card } from '$lib/components/ui';
  import { formatDate } from '$lib/utils/helpers';

  let { data }: { data: PageData } = $props();

  const conversations = $derived(data.conversations ?? []);
</script>

<div class="p-6 max-w-2xl mx-auto">
  <h1 class="text-2xl font-bold mb-6">Messages</h1>

  {#if conversations.length === 0}
    <div class="flex items-center justify-center py-16 text-gray-500">
      No conversations yet
    </div>
  {:else}
    <div class="flex flex-col gap-2">
      {#each conversations as conversation (conversation.id)}
        <a href="/teacher/messages/{conversation.id}" class="block">
          <Card class="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
            <div class="flex items-center gap-4">
              <!-- Avatar -->
              <div class="w-11 h-11 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                {conversation.parent?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>

              <!-- Middle: names + preview -->
              <div class="flex-1 min-w-0">
                <p class="font-bold text-gray-900 truncate">{conversation.parent?.name ?? 'Unknown Parent'}</p>
                <p class="text-sm text-gray-500 truncate">{conversation.student?.name ?? 'Unknown Student'}</p>
                {#if conversation.lastMessage}
                  <p class="text-sm text-gray-400 truncate mt-0.5">{conversation.lastMessage.body}</p>
                {/if}
              </div>

              <!-- Right: time + unread badge -->
              <div class="flex flex-col items-end gap-1 flex-shrink-0">
                {#if conversation.lastMessage}
                  <span class="text-xs text-gray-400">{formatDate(conversation.lastMessage.createdAt)}</span>
                {/if}
                {#if conversation.unreadCount > 0}
                  <span class="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold">
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
