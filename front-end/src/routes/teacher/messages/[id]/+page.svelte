<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createConsumer } from '@rails/actioncable';
  import { formatDate } from '$lib/utils/helpers';

  let { data } = $props();

  let messages = $state([...data.conversation.messages]);
  let inputValue = $state('');
  let errorMessage = $state('');
  let scrollContainer = $state<HTMLDivElement | null>(null);
  let consumer: ReturnType<typeof createConsumer> | null = null;

  const SEND_MESSAGE_MUTATION = `
    mutation SendMessage($conversationId: ID!, $body: String!) {
      sendMessage(conversationId: $conversationId, body: $body) {
        message { id body senderName senderType senderId mine createdAt }
        errors { message path }
      }
    }
  `;

  function scrollToBottom() {
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }

  $effect(() => {
    // Track messages length to trigger scroll
    messages.length;
    setTimeout(scrollToBottom, 50);
  });

  async function sendMessage() {
    const body = inputValue.trim();
    if (!body) return;

    inputValue = '';
    errorMessage = '';

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: SEND_MESSAGE_MUTATION,
          variables: { conversationId: data.conversation.id, body }
        })
      });

      const json = await response.json();
      const result = json.data?.sendMessage;

      if (result?.errors?.length) {
        errorMessage = result.errors[0].message;
        setTimeout(() => (errorMessage = ''), 3000);
      } else if (result?.message) {
        const msg = result.message;
        if (!messages.find((m: any) => m.id === msg.id)) {
          messages = [...messages, msg];
        }
      }
    } catch (e) {
      errorMessage = 'Failed to send message. Please try again.';
      setTimeout(() => (errorMessage = ''), 3000);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  onMount(() => {
    scrollToBottom();

    consumer = createConsumer(`ws://localhost:3004/cable?token=${data.accessToken}`);
    consumer.subscriptions.create(
      { channel: 'ChatChannel', conversation_id: data.conversation.id },
      {
        received(payload: any) {
          if (payload.type === 'new_message') {
            const msg = payload.message;
            if (!messages.find((m: any) => m.id === msg.id)) {
              messages = [...messages, msg];
            }
          }
        }
      }
    );
  });

  onDestroy(() => {
    consumer?.disconnect();
  });
</script>

<div class="flex flex-col h-screen bg-gray-50">
  <!-- Header -->
  <header class="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shadow-sm">
    <a href="/teacher/messages" class="text-gray-500 hover:text-gray-700 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </a>
    <div>
      <p class="font-bold text-gray-900 leading-tight">{data.conversation.parent.name}</p>
      <p class="text-sm text-gray-500">about {data.conversation.student.name}</p>
    </div>
  </header>

  <!-- Messages area -->
  <div
    bind:this={scrollContainer}
    class="flex-1 overflow-y-auto px-4 py-4 space-y-3"
  >
    {#each messages as message (message.id)}
      <div class="flex {message.mine ? 'justify-end' : 'justify-start'}">
        <div
          class="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl {message.mine
            ? 'bg-blue-500 text-white rounded-br-sm'
            : 'bg-slate-200 text-gray-900 rounded-bl-sm'}"
        >
          <p class="text-sm leading-relaxed">{message.body}</p>
          <p class="text-xs mt-1 {message.mine ? 'text-blue-100' : 'text-gray-500'}">
            {formatDate(message.createdAt)}
          </p>
        </div>
      </div>
    {/each}

    {#if messages.length === 0}
      <p class="text-center text-gray-400 text-sm mt-8">No messages yet. Say hello!</p>
    {/if}
  </div>

  <!-- Error message -->
  {#if errorMessage}
    <div class="px-4 py-2 bg-red-50 text-red-600 text-sm text-center border-t border-red-100">
      {errorMessage}
    </div>
  {/if}

  <!-- Input bar -->
  <div class="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3">
    <input
      type="text"
      bind:value={inputValue}
      onkeydown={handleKeydown}
      placeholder="Type a message..."
      class="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-300 transition"
    />
    <button
      onclick={sendMessage}
      disabled={!inputValue.trim()}
      class="bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full p-2 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
      </svg>
    </button>
  </div>
</div>
