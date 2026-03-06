<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createConsumer } from '@rails/actioncable';
  import { formatDate } from '$lib/utils/helpers';
  let { data }: { data: any } = $props();

  // ── State ──────────────────────────────────────────────────────────────────
  type ActiveChat = { type: 'direct' | 'group'; id: string; classroomId?: string } | null;

  let activeChat = $state<ActiveChat>(null);
  let messages = $state<any[]>([]);
  let inputValue = $state('');
  let errorMessage = $state('');
  let loading = $state(false);
  let scrollContainer = $state<HTMLDivElement | null>(null);
  let consumer: ReturnType<typeof createConsumer> | null = null;
  let subscription: any = null;
  let searchQuery = $state('');

  // ── Derived sidebar data ───────────────────────────────────────────────────
  const groupChats = $derived(
    (data.classrooms ?? []).map((classroom: any) => {
      const gc = (data.groupConversations ?? []).find(
        (g: any) => g.classroom?.id === classroom.id
      );
      return {
        classroomId: classroom.id,
        classroomName: classroom.name,
        groupConversationId: gc?.id ?? null,
        lastMessage: gc?.lastMessage ?? null
      };
    })
  );

  const filteredGroupChats = $derived(
    groupChats.filter((g: any) =>
      g.classroomName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const filteredDirectChats = $derived(
    (data.conversations ?? []).filter((c: any) =>
      (c.parent?.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.student?.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // ── Active chat metadata ───────────────────────────────────────────────────
  const activeChatMeta = $derived(() => {
    const chat = activeChat;
    if (!chat) return null;
    if (chat.type === 'group') {
      const gc = groupChats.find((g: any) => g.classroomId === chat.classroomId);
      return gc ? { title: gc.classroomName, subtitle: 'Group Chat' } : null;
    } else {
      const conv = (data.conversations ?? []).find((c: any) => c.id === chat.id);
      return conv
        ? { title: conv.parent?.name ?? 'Unknown', subtitle: `about ${conv.student?.name ?? ''}` }
        : null;
    }
  });

  // ── GraphQL queries/mutations ──────────────────────────────────────────────
  const DIRECT_MESSAGES_QUERY = `
    query Conversation($id: ID!) {
      conversation(id: $id) {
        messages { id body senderName senderType senderId mine createdAt }
      }
    }
  `;

  const GROUP_MESSAGES_QUERY = `
    query GroupConversation($id: ID!) {
      groupConversation(id: $id) {
        messages { id body senderName senderType senderId mine createdAt }
      }
    }
  `;

  const SEND_MESSAGE_MUTATION = `
    mutation SendMessage($conversationId: ID!, $body: String!) {
      sendMessage(conversationId: $conversationId, body: $body) {
        message { id body senderName senderType senderId mine createdAt }
        errors { message }
      }
    }
  `;

  const SEND_GROUP_MESSAGE_MUTATION = `
    mutation SendGroupMessage($groupConversationId: ID!, $body: String!) {
      sendGroupMessage(groupConversationId: $groupConversationId, body: $body) {
        message { id body senderName senderType senderId mine createdAt }
        errors { message }
      }
    }
  `;

  const CREATE_GROUP_CONVERSATION_MUTATION = `
    mutation CreateGroupConversation($classroomId: ID!) {
      createGroupConversation(classroomId: $classroomId) {
        groupConversation { id }
        errors { message }
      }
    }
  `;

  // ── Helpers ────────────────────────────────────────────────────────────────
  async function gql(query: string, variables: Record<string, any> = {}) {
    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });
    const json = await res.json();
    return json.data;
  }

  function scrollToBottom() {
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }

  function addMessage(msg: any) {
    if (!messages.find((m) => m.id === msg.id)) {
      messages = [...messages, msg];
    }
  }

  // ── Cable subscription ─────────────────────────────────────────────────────
  function subscribeToChat(chat: ActiveChat) {
    subscription?.unsubscribe();
    subscription = null;
    if (!chat || !consumer) return;

    if (chat.type === 'direct') {
      subscription = consumer.subscriptions.create(
        { channel: 'ChatChannel', conversation_id: chat.id },
        {
          received(payload: any) {
            if (payload.type === 'new_message') addMessage(payload.message);
            setTimeout(scrollToBottom, 50);
          }
        }
      );
    } else if (chat.id) {
      subscription = consumer.subscriptions.create(
        { channel: 'GroupChatChannel', group_conversation_id: chat.id },
        {
          received(payload: any) {
            if (payload.type === 'new_group_message') addMessage(payload.message);
            setTimeout(scrollToBottom, 50);
          }
        }
      );
    }
  }

  // ── Select chat ────────────────────────────────────────────────────────────
  async function selectDirectChat(conv: any) {
    activeChat = { type: 'direct', id: conv.id };
    messages = [];
    loading = true;
    const res = await gql(DIRECT_MESSAGES_QUERY, { id: conv.id });
    messages = res?.conversation?.messages ?? [];
    loading = false;
    subscribeToChat(activeChat);
    setTimeout(scrollToBottom, 100);
  }

  async function selectGroupChat(gc: any) {
    let groupConvId = gc.groupConversationId;

    // Auto-create group conversation if it doesn't exist
    if (!groupConvId) {
      const res = await gql(CREATE_GROUP_CONVERSATION_MUTATION, { classroomId: gc.classroomId });
      groupConvId = res?.createGroupConversation?.groupConversation?.id ?? null;
    }

    activeChat = { type: 'group', id: groupConvId ?? '', classroomId: gc.classroomId };
    messages = [];

    if (groupConvId) {
      loading = true;
      const res = await gql(GROUP_MESSAGES_QUERY, { id: groupConvId });
      messages = res?.groupConversation?.messages ?? [];
      loading = false;
      subscribeToChat(activeChat);
      setTimeout(scrollToBottom, 100);
    }
  }

  // ── Send message ───────────────────────────────────────────────────────────
  async function sendMessage() {
    const body = inputValue.trim();
    if (!body || !activeChat) return;

    inputValue = '';
    errorMessage = '';

    try {
      let result: any;
      if (activeChat.type === 'direct') {
        const res = await gql(SEND_MESSAGE_MUTATION, { conversationId: activeChat.id, body });
        result = res?.sendMessage;
      } else {
        // If no group conv yet (shouldn't happen after selectGroupChat, but safety check)
        if (!activeChat.id) {
          const createRes = await gql(CREATE_GROUP_CONVERSATION_MUTATION, {
            classroomId: activeChat.classroomId
          });
          const newId = createRes?.createGroupConversation?.groupConversation?.id;
          if (newId) {
            activeChat = { ...activeChat, id: newId };
            subscribeToChat(activeChat);
          }
        }
        const res = await gql(SEND_GROUP_MESSAGE_MUTATION, {
          groupConversationId: activeChat.id,
          body
        });
        result = res?.sendGroupMessage;
      }

      if (result?.errors?.length) {
        errorMessage = result.errors[0].message;
        setTimeout(() => (errorMessage = ''), 3000);
      } else if (result?.message) {
        addMessage(result.message);
        setTimeout(scrollToBottom, 50);
      }
    } catch {
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

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  onMount(() => {
    consumer = createConsumer(`ws://localhost:3004/cable?token=${data.accessToken}`);
  });

  onDestroy(() => {
    subscription?.unsubscribe();
    consumer?.disconnect();
  });
</script>

<div class="flex h-[calc(100vh-64px)] bg-background overflow-hidden">
  <!-- ── Left Sidebar ───────────────────────────────────────────────────── -->
  <aside class="w-80 flex-shrink-0 flex flex-col bg-white border-r border-gray-200">
    <!-- Header -->
    <div class="px-4 py-4 border-b border-gray-100">
      <h1 class="text-xl font-bold text-text mb-3">Chats</h1>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search..."
        class="w-full bg-gray-100 rounded-full px-4 py-2 text-sm text-text placeholder-text-muted outline-none focus:ring-2 focus:ring-primary/40 transition"
      />
    </div>

    <!-- Chat list -->
    <div class="flex-1 overflow-y-auto">
      <!-- Group Chats section -->
      {#if filteredGroupChats.length > 0}
        <div class="px-4 pt-4 pb-1">
          <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">Group Chats</p>
        </div>
        {#each filteredGroupChats as gc}
          {@const isActive = activeChat?.type === 'group' && activeChat.classroomId === gc.classroomId}
          <button
            onclick={() => selectGroupChat(gc)}
            class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors {isActive
              ? 'bg-primary/10 border-r-2 border-primary'
              : ''}"
          >
            <div
              class="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 text-lg"
            >
              📚
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-text text-sm truncate">{gc.classroomName}</p>
              {#if gc.lastMessage}
                <p class="text-xs text-text-muted truncate mt-0.5">{gc.lastMessage.body}</p>
              {:else}
                <p class="text-xs text-text-muted italic">No messages yet</p>
              {/if}
            </div>
            {#if gc.lastMessage}
              <span class="text-xs text-text-muted flex-shrink-0"
                >{formatDate(gc.lastMessage.createdAt)}</span
              >
            {/if}
          </button>
        {/each}
      {/if}

      <!-- Direct Messages section -->
      {#if filteredDirectChats.length > 0}
        <div class="px-4 pt-4 pb-1">
          <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Direct Messages
          </p>
        </div>
        {#each filteredDirectChats as conv}
          {@const isActive = activeChat?.type === 'direct' && activeChat.id === conv.id}
          <button
            onclick={() => selectDirectChat(conv)}
            class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors {isActive
              ? 'bg-primary/10 border-r-2 border-primary'
              : ''}"
          >
            <!-- Avatar -->
            <div
              class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
            >
              {conv.parent?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-text text-sm truncate">
                {conv.parent?.name ?? 'Unknown Parent'}
              </p>
              <p class="text-xs text-text-muted truncate">{conv.student?.name ?? ''}</p>
              {#if conv.lastMessage}
                <p class="text-xs text-text-muted truncate mt-0.5">{conv.lastMessage.body}</p>
              {/if}
            </div>
            <!-- Meta -->
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              {#if conv.lastMessage}
                <span class="text-xs text-text-muted">{formatDate(conv.lastMessage.createdAt)}</span
                >
              {/if}
              {#if conv.unreadCount > 0}
                <span
                  class="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold"
                >
                  {conv.unreadCount}
                </span>
              {/if}
            </div>
          </button>
        {/each}
      {/if}

      {#if filteredGroupChats.length === 0 && filteredDirectChats.length === 0}
        <div class="flex items-center justify-center py-16 text-text-muted text-sm">
          No conversations found
        </div>
      {/if}
    </div>
  </aside>

  <!-- ── Right Chat Panel ───────────────────────────────────────────────── -->
  <div class="flex-1 flex flex-col min-w-0">
    {#if !activeChat}
      <!-- Empty state -->
      <div class="flex-1 flex flex-col items-center justify-center gap-3 text-text-muted">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-16 w-16 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1.5"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p class="text-lg font-medium">Select a conversation to start chatting</p>
      </div>
    {:else}
      <!-- Chat header -->
      <header class="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3 shadow-sm flex-shrink-0">
        {#if activeChat.type === 'group'}
          <div
            class="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-lg"
          >
            📚
          </div>
        {:else}
          {@const conv = (data.conversations ?? []).find((c: any) => c.id === activeChat?.id)}
          <div
            class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-semibold"
          >
            {conv?.parent?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
        {/if}
        <div>
          {#if activeChat.type === 'group'}
            {@const gc = groupChats.find((g: any) => g.classroomId === activeChat?.classroomId)}
            <p class="font-bold text-text">{gc?.classroomName ?? 'Group Chat'}</p>
            <p class="text-sm text-text-muted">Group Chat</p>
          {:else}
            {@const conv = (data.conversations ?? []).find((c: any) => c.id === activeChat?.id)}
            <p class="font-bold text-text">{conv?.parent?.name ?? 'Unknown'}</p>
            <p class="text-sm text-text-muted">about {conv?.student?.name ?? ''}</p>
          {/if}
        </div>
      </header>

      <!-- Messages area -->
      <div bind:this={scrollContainer} class="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50">
        {#if loading}
          <div class="flex items-center justify-center py-16 text-text-muted text-sm">
            Loading messages...
          </div>
        {:else if messages.length === 0}
          <p class="text-center text-text-muted text-sm mt-8">No messages yet. Say hello! 👋</p>
        {:else}
          {#each messages as message (message.id)}
            <div class="flex {message.mine ? 'justify-end' : 'justify-start'}">
              <div
                class="max-w-xs lg:max-w-md px-4 py-2 rounded-2xl {message.mine
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-slate-200 text-text rounded-bl-sm'}"
              >
                {#if !message.mine && activeChat.type === 'group'}
                  <p class="text-xs font-semibold mb-1 {message.mine ? 'text-blue-100' : 'text-text-muted'}">
                    {message.senderName}
                  </p>
                {/if}
                <p class="text-sm leading-relaxed">{message.body}</p>
                <p class="text-xs mt-1 {message.mine ? 'text-blue-100' : 'text-text-muted'}">
                  {formatDate(message.createdAt)}
                </p>
              </div>
            </div>
          {/each}
        {/if}
      </div>

      <!-- Error bar -->
      {#if errorMessage}
        <div
          class="px-6 py-2 bg-red-50 text-red-600 text-sm text-center border-t border-red-100 flex-shrink-0"
        >
          {errorMessage}
        </div>
      {/if}

      <!-- Input bar -->
      <div class="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <input
          type="text"
          bind:value={inputValue}
          onkeydown={handleKeydown}
          placeholder="Type a message..."
          class="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-text placeholder-text-muted outline-none focus:ring-2 focus:ring-primary/40 transition"
        />
        <button
          onclick={sendMessage}
          disabled={!inputValue.trim()}
          class="bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full p-2.5 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    {/if}
  </div>
</div>
