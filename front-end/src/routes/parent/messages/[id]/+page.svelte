<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createConsumer } from '@rails/actioncable';
  import { formatDate } from '$lib/utils/helpers';

  let { data } = $props();

  let messages = $state([...data.conversation.messages]);
  let inputValue = $state('');
  let scrollContainer = $state<HTMLElement | null>(null);
  let consumer: ReturnType<typeof createConsumer> | null = null;

  const conversation = data.conversation;
  const teacher = conversation.teacher;
  const student = conversation.student;

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

  onMount(() => {
    consumer = createConsumer(`ws://localhost:3004/cable?token=${data.accessToken}`);

    consumer.subscriptions.create(
      { channel: 'ChatChannel', conversation_id: conversation.id },
      {
        received(payload: any) {
          if (payload.type === 'new_message') {
            const msg = payload.message;
            const alreadyExists = messages.some((m: any) => m.id === msg.id);
            if (!alreadyExists) {
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

  async function sendMessage() {
    const body = inputValue.trim();
    if (!body) return;

    inputValue = '';

    const SEND_MESSAGE_MUTATION = `
      mutation SendMessage($conversationId: ID!, $body: String!) {
        sendMessage(conversationId: $conversationId, body: $body) {
          message { id body senderName senderType senderId mine createdAt }
          errors { message path }
        }
      }
    `;

    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: SEND_MESSAGE_MUTATION,
          variables: { conversationId: conversation.id, body }
        })
      });

      const json = await res.json();
      const result = json?.data?.sendMessage;

      if (result?.message) {
        const alreadyExists = messages.some((m: any) => m.id === result.message.id);
        if (!alreadyExists) {
          messages = [...messages, result.message];
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      inputValue = body;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }
</script>

<div class="flex flex-col h-screen bg-slate-50">
  <!-- Header -->
  <div class="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
    <a href="/parent/messages" class="text-slate-500 hover:text-slate-700 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </a>
    <div class="flex flex-col">
      <span class="font-semibold text-slate-800 leading-tight">{teacher.name}</span>
      <span class="text-xs text-slate-400">about {student.name}</span>
    </div>
  </div>

  <!-- Messages area -->
  <div
    bind:this={scrollContainer}
    class="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2"
  >
    {#if messages.length === 0}
      <div class="flex-1 flex items-center justify-center">
        <p class="text-slate-400 text-sm">No messages yet. Say hello!</p>
      </div>
    {/if}

    {#each messages as message (message.id)}
      <div class="flex {message.mine ? 'justify-end' : 'justify-start'}">
        <div
          class="max-w-[75%] px-4 py-2.5 rounded-2xl {message.mine
            ? 'bg-blue-500 text-white rounded-br-sm'
            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'}"
        >
          <p class="text-sm leading-relaxed">{message.body}</p>
          <p class="text-xs mt-1 {message.mine ? 'text-blue-100' : 'text-slate-400'}">
            {formatDate(message.createdAt)}
          </p>
        </div>
      </div>
    {/each}
  </div>

  <!-- Input bar -->
  <div class="bg-white border-t border-slate-200 px-4 py-3 flex items-center gap-3">
    <input
      type="text"
      bind:value={inputValue}
      onkeydown={handleKeydown}
      placeholder="Type a message..."
      class="flex-1 bg-slate-100 rounded-full px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-300 transition"
    />
    <button
      onclick={sendMessage}
      disabled={!inputValue.trim()}
      class="w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</div>
