<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import * as m from '$lib/paraglide/messages.js';
  import { createConsumer } from '@rails/actioncable';
  import { formatDate } from '$lib/utils/helpers';
  import { uploadFiles } from '$lib/api/upload';
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
  let selectedMedia: File[] = $state([]);
  let selectedDocs: File[] = $state([]);
  let fileInput: HTMLInputElement = $state()!;
  let cameraInput: HTMLInputElement = $state()!;
  let textareaEl: HTMLTextAreaElement = $state()!;
  let showEmojiPicker = $state(false);
  let uploading = $state(false);
  let showNewChatModal = $state(false);
  let newChatClassroomId = $state('');
  const MAX_FILE_SIZE = 2 * 1024 * 1024;
  const MAX_MEDIA = 4;
  const MAX_DOCS = 4;

  // ── Derived modal data ────────────────────────────────────────────────────
  const newChatStudents = $derived(
    newChatClassroomId
      ? (data.classrooms ?? []).find((c: any) => c.id === newChatClassroomId)?.students ?? []
      : []
  );

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

  // ── Emoji picker action ────────────────────────────────────────────────────
  function bindEmojiPicker(node: HTMLElement) {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail;
      const emoji: string = detail?.unicode;
      if (!emoji || !textareaEl) return;
      const start = textareaEl.selectionStart;
      const end = textareaEl.selectionEnd;
      const value = textareaEl.value;
      textareaEl.value = value.slice(0, start) + emoji + value.slice(end);
      textareaEl.selectionStart = textareaEl.selectionEnd = start + emoji.length;
      inputValue = textareaEl.value;
      textareaEl.focus();
      showEmojiPicker = false;
    }
    node.addEventListener('emoji-click', handler);
    return {
      destroy() { node.removeEventListener('emoji-click', handler); }
    };
  }

  // ── GraphQL queries/mutations ──────────────────────────────────────────────
  const DIRECT_MESSAGES_QUERY = `
    query Conversation($id: ID!) {
      conversation(id: $id) {
        messages { id body senderName senderType senderId mine createdAt attachments { url filename contentType } }
      }
    }
  `;

  const GROUP_MESSAGES_QUERY = `
    query GroupConversation($id: ID!) {
      groupConversation(id: $id) {
        messages { id body senderName senderType senderId mine createdAt attachments { url filename contentType } }
      }
    }
  `;

  const SEND_MESSAGE_MUTATION = `
    mutation SendMessage($conversationId: ID!, $body: String!, $signedBlobIds: [String!]) {
      sendMessage(conversationId: $conversationId, body: $body, signedBlobIds: $signedBlobIds) {
        message { id body senderName senderType senderId mine createdAt attachments { url filename contentType } }
        errors { message }
      }
    }
  `;

  const SEND_GROUP_MESSAGE_MUTATION = `
    mutation SendGroupMessage($groupConversationId: ID!, $body: String!, $signedBlobIds: [String!]) {
      sendGroupMessage(groupConversationId: $groupConversationId, body: $body, signedBlobIds: $signedBlobIds) {
        message { id body senderName senderType senderId mine createdAt attachments { url filename contentType } }
        errors { message }
      }
    }
  `;

  const CREATE_CONVERSATION_MUTATION = `
    mutation CreateConversation($studentId: ID!, $parentId: ID) {
      createConversation(studentId: $studentId, parentId: $parentId) {
        conversation { id student { id name } parent { id name } teacher { id name } }
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
    if (json.errors?.length) {
      throw new Error(json.errors[0].message || 'GraphQL error');
    }
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
    const hasAttachments = selectedMedia.length > 0 || selectedDocs.length > 0;
    if ((!body && !hasAttachments) || !activeChat) return;

    const mediaToSend = [...selectedMedia];
    const docsToSend = [...selectedDocs];
    inputValue = '';
    selectedMedia = [];
    selectedDocs = [];
    showEmojiPicker = false;
    errorMessage = '';

    try {
      let signedBlobIds: string[] = [];
      const allFiles = [...mediaToSend, ...docsToSend];
      if (allFiles.length > 0) {
        uploading = true;
        signedBlobIds = await uploadFiles(allFiles);
        uploading = false;
      }

      let result: any;
      if (activeChat.type === 'direct') {
        const res = await gql(SEND_MESSAGE_MUTATION, {
          conversationId: activeChat.id,
          body: body || '',
          signedBlobIds: signedBlobIds.length > 0 ? signedBlobIds : null
        });
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
          body: body || '',
          signedBlobIds: signedBlobIds.length > 0 ? signedBlobIds : null
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
    } catch (err: any) {
      uploading = false;
      errorMessage = err?.message || 'Failed to send message. Please try again.';
      setTimeout(() => (errorMessage = ''), 5000);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── New chat handler ───────────────────────────────────────────────────────
  async function startNewChat(studentId: string, parentId: string) {
    try {
      const res = await gql(CREATE_CONVERSATION_MUTATION, { studentId, parentId });
      const conv = res?.createConversation?.conversation;
      if (conv) {
        if (!data.conversations.find((c: any) => c.id === conv.id)) {
          data.conversations = [conv, ...data.conversations];
        }
        showNewChatModal = false;
        newChatClassroomId = '';
        selectDirectChat(conv);
      }
      const errors = res?.createConversation?.errors;
      if (errors?.length) {
        errorMessage = errors[0].message;
        setTimeout(() => (errorMessage = ''), 3000);
      }
    } catch (err: any) {
      errorMessage = err.message || 'Failed to create conversation';
      setTimeout(() => (errorMessage = ''), 3000);
    }
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  onMount(() => {
    consumer = createConsumer(`${data.cableUrl}?token=${data.accessToken}`);
    import('emoji-picker-element');
  });

  onDestroy(() => {
    subscription?.unsubscribe();
    consumer?.disconnect();
  });
</script>

<div class="flex h-full -m-6 bg-background overflow-hidden">
  <!-- ── Left Sidebar ───────────────────────────────────────────────────── -->
  <aside class="w-80 flex-shrink-0 flex flex-col bg-white border-r border-gray-200">
    <!-- Header -->
    <div class="px-4 py-4 border-b border-gray-100">
      <h1 class="text-xl font-bold text-text mb-3">{m.messages_chats()}</h1>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder={m.messages_search_placeholder()}
        class="w-full bg-gray-100 rounded-full px-4 py-2 text-sm text-text placeholder-text-muted outline-none focus:ring-2 focus:ring-primary/40 transition"
      />
      <button
        onclick={() => showNewChatModal = true}
        class="w-full mt-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-full px-4 py-2 transition-colors"
      >
        {m.messages_new_chat()}
      </button>
    </div>

    <!-- Chat list -->
    <div class="flex-1 overflow-y-auto">
      <!-- Group Chats section -->
      {#if filteredGroupChats.length > 0}
        <div class="px-4 pt-4 pb-1">
          <p class="text-xs font-semibold text-text-muted uppercase tracking-wider">{m.messages_group_chats()}</p>
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
                <p class="text-xs text-text-muted italic">{m.messages_no_messages_italic()}</p>
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
            {m.messages_direct_messages()}
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
          {m.messages_no_conversations()}
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
        <p class="text-lg font-medium">{m.messages_select_conversation()}</p>
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
            <p class="text-sm text-text-muted">{m.messages_group_chat()}</p>
          {:else}
            {@const conv = (data.conversations ?? []).find((c: any) => c.id === activeChat?.id)}
            <p class="font-bold text-text">{conv?.parent?.name ?? 'Unknown'}</p>
            <p class="text-sm text-text-muted">{m.messages_about({ student: conv?.student?.name ?? '' })}</p>
          {/if}
        </div>
      </header>

      <!-- Messages area -->
      <div bind:this={scrollContainer} class="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-gray-50">
        {#if loading}
          <div class="flex items-center justify-center py-16 text-text-muted text-sm">
            {m.messages_loading()}
          </div>
        {:else if messages.length === 0}
          <p class="text-center text-text-muted text-sm mt-8">{m.messages_no_messages_yet()}</p>
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
                {#if message.body}
                  <p class="text-sm leading-relaxed">{message.body}</p>
                {/if}
                <!-- Inline image attachments -->
                {#if message.attachments?.length > 0}
                  {@const imageAttachments = message.attachments.filter((a: any) => a.contentType?.startsWith('image/'))}
                  {@const videoAttachments = message.attachments.filter((a: any) => a.contentType?.startsWith('video/'))}
                  {@const docAttachments = message.attachments.filter((a: any) => !a.contentType?.startsWith('image/') && !a.contentType?.startsWith('video/'))}
                  {#if imageAttachments.length > 0}
                    <div class="mt-2 flex flex-wrap gap-1.5">
                      {#each imageAttachments as att}
                        <a href={att.url} target="_blank" rel="noopener noreferrer" class="block rounded-lg overflow-hidden">
                          <img src={att.url} alt={att.filename} class="max-w-[200px] max-h-[200px] rounded-lg object-cover" />
                        </a>
                      {/each}
                    </div>
                  {/if}
                  {#if videoAttachments.length > 0}
                    <div class="mt-2 space-y-1.5">
                      {#each videoAttachments as att}
                        <video src={att.url} controls class="max-w-[240px] rounded-lg"></video>
                      {/each}
                    </div>
                  {/if}
                  {#if docAttachments.length > 0}
                    <div class="mt-2 space-y-1">
                      {#each docAttachments as att}
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={att.filename}
                          class="flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors {message.mine ? 'bg-white/20 hover:bg-white/30' : 'bg-white/60 hover:bg-white/80'}"
                        >
                          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <span class="text-xs truncate max-w-[160px]">{att.filename}</span>
                          <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </a>
                      {/each}
                    </div>
                  {/if}
                {/if}
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

      <!-- Attachment previews -->
      {#if selectedMedia.length > 0 || selectedDocs.length > 0}
        <div class="bg-white border-t border-gray-100 px-4 pt-3 flex-shrink-0">
          {#if selectedMedia.length > 0}
            <div class="flex flex-wrap gap-2 mb-2">
              {#each selectedMedia as file, i}
                <div class="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                  {#if file.type.startsWith('image/')}
                    <img src={URL.createObjectURL(file)} alt={file.name} class="w-full h-full object-cover" />
                  {:else}
                    <div class="flex flex-col items-center justify-center h-full p-1">
                      <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                      </svg>
                      <span class="text-[9px] text-slate-500 truncate w-full text-center mt-0.5">{file.name.split('.').pop()}</span>
                    </div>
                  {/if}
                  <button
                    type="button"
                    onclick={() => { selectedMedia = selectedMedia.filter((_, idx) => idx !== i); }}
                    class="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >&times;</button>
                </div>
              {/each}
            </div>
          {/if}
          {#if selectedDocs.length > 0}
            <div class="space-y-1 mb-2">
              {#each selectedDocs as file, i}
                <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 group text-sm">
                  <svg class="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span class="flex-1 min-w-0 text-text truncate">{file.name}</span>
                  <button
                    type="button"
                    onclick={() => { selectedDocs = selectedDocs.filter((_, idx) => idx !== i); }}
                    class="p-0.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}

      <!-- Input bar -->
      <div class="bg-white border-t border-gray-200 px-4 py-3 flex-shrink-0">
        <div class="relative flex items-end gap-2">
          <!-- Attach document -->
          <button
            type="button"
            disabled={uploading || selectedDocs.length >= MAX_DOCS}
            onclick={() => fileInput.click()}
            class="p-2 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 self-end"
            title="Attach document ({selectedDocs.length}/{MAX_DOCS})"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </button>
          <!-- Camera / Media -->
          <button
            type="button"
            disabled={uploading || selectedMedia.length >= MAX_MEDIA}
            onclick={() => cameraInput.click()}
            class="p-2 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0 self-end"
            title="Photo or video ({selectedMedia.length}/{MAX_MEDIA})"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </button>
          <!-- Textarea -->
          <textarea
            bind:this={textareaEl}
            bind:value={inputValue}
            onkeydown={handleKeydown}
            disabled={uploading}
            placeholder={m.messages_type_placeholder()}
            rows={1}
            class="flex-1 bg-gray-100 rounded-2xl px-4 py-2 text-sm text-text placeholder-text-muted outline-none focus:ring-2 focus:ring-primary/40 transition resize-none max-h-24 overflow-y-auto"
            oninput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 96) + 'px';
            }}
          ></textarea>
          <!-- Emoji -->
          <div class="relative flex-shrink-0 self-end">
            <button
              type="button"
              disabled={uploading}
              onclick={() => showEmojiPicker = !showEmojiPicker}
              class="p-2 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed {showEmojiPicker ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-primary hover:bg-primary/10'}"
              title="Emoji"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
              </svg>
            </button>
            {#if showEmojiPicker}
              <!-- svelte-ignore a11y_no_static_element_interactions -->
              <div class="fixed inset-0 z-[60]" onclick={() => showEmojiPicker = false}></div>
              <div class="absolute bottom-full right-0 mb-2 z-[70]">
                <emoji-picker
                  class="light"
                  use:bindEmojiPicker
                ></emoji-picker>
              </div>
            {/if}
          </div>
          <!-- Send -->
          <button
            onclick={sendMessage}
            disabled={uploading || (!inputValue.trim() && selectedMedia.length === 0 && selectedDocs.length === 0)}
            class="bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full p-2.5 transition-colors flex-shrink-0 self-end"
          >
            {#if uploading}
              <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            {/if}
          </button>
        </div>
      </div>

      <!-- Hidden file inputs -->
      <input
        bind:this={fileInput}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.odp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,text/csv"
        multiple
        class="hidden"
        onchange={(e) => {
          const input = e.target as HTMLInputElement;
          if (input.files) {
            const files = Array.from(input.files);
            const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
            if (oversized.length > 0) {
              errorMessage = `File "${oversized[0].name}" exceeds 2 MB limit`;
              setTimeout(() => (errorMessage = ''), 3000);
              input.value = '';
              return;
            }
            selectedDocs = [...selectedDocs, ...files].slice(0, MAX_DOCS);
            input.value = '';
          }
        }}
      />
      <input
        bind:this={cameraInput}
        type="file"
        accept="image/*,video/*"
        multiple
        class="hidden"
        onchange={(e) => {
          const input = e.target as HTMLInputElement;
          if (input.files) {
            const files = Array.from(input.files);
            const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
            if (oversized.length > 0) {
              errorMessage = `File "${oversized[0].name}" exceeds 2 MB limit`;
              setTimeout(() => (errorMessage = ''), 3000);
              input.value = '';
              return;
            }
            selectedMedia = [...selectedMedia, ...files].slice(0, MAX_MEDIA);
            input.value = '';
          }
        }}
      />
    {/if}
  </div>
</div>

{#if showNewChatModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onkeydown={(e) => { if (e.key === 'Escape') showNewChatModal = false; }}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0" onclick={() => showNewChatModal = false}></div>
    <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-text">{m.messages_new_conversation()}</h2>
        <button type="button" onclick={() => showNewChatModal = false} class="p-1 rounded-lg text-text-muted hover:text-text hover:bg-slate-100 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Classroom selector -->
      <div class="mb-4">
        <label for="new-chat-classroom" class="block text-sm font-medium text-text mb-1">{m.calendar_classroom_label()}</label>
        <select
          id="new-chat-classroom"
          bind:value={newChatClassroomId}
          class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">{m.messages_select_classroom_hint()}</option>
          {#each data.classrooms ?? [] as classroom}
            <option value={classroom.id}>{classroom.name}</option>
          {/each}
        </select>
      </div>

      <!-- Student/Parent list -->
      {#if newChatStudents.length > 0}
        <div class="max-h-64 overflow-y-auto space-y-1">
          {#each newChatStudents as student}
            {#each student.parents ?? [] as parent}
              <button
                type="button"
                onclick={() => startNewChat(student.id, parent.id)}
                class="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <div class="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {parent.name?.charAt(0)?.toUpperCase() ?? '?'}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-text truncate">{parent.name}</p>
                  <p class="text-xs text-text-muted truncate">{m.messages_parent_of({ student: student.name })}</p>
                </div>
              </button>
            {/each}
          {/each}
        </div>
      {:else if newChatClassroomId}
        <p class="text-sm text-text-muted text-center py-4">{m.messages_no_students()}</p>
      {:else}
        <p class="text-sm text-text-muted text-center py-4">{m.messages_select_classroom_hint()}</p>
      {/if}
    </div>
  </div>
{/if}
