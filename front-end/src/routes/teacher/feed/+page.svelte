<script lang="ts">
  import { onMount } from 'svelte';
  import { Button, Alert } from '$lib/components/ui';
  import { FeedCard } from '$lib/components/feed';
  import { uploadFiles } from '$lib/api/upload';

  onMount(() => import('emoji-picker-element'));

  let { data } = $props();

  let showModal = $state(false);
  let selectedFiles: File[] = $state([]);
  let fileInput: HTMLInputElement = $state()!;
  let cameraInput: HTMLInputElement = $state()!;
  let textareaEl: HTMLTextAreaElement = $state()!;
  let showEmojiPicker = $state(false);
  let uploading = $state(false);
  let uploadError = $state('');
  let selectedClassroomId = $state('all');
  let selectedStudentIds: string[] = $state([]);

  const isAllClasses = $derived(selectedClassroomId === 'all');

  // Get students for the selected classroom (only when specific class selected)
  const classroomStudents = $derived(
    isAllClasses ? [] : (data.classrooms.find((c) => c.id === selectedClassroomId)?.students ?? [])
  );

  // Reset student selection when classroom changes
  $effect(() => {
    selectedClassroomId;
    selectedStudentIds = [];
  });

  function openModal() {
    selectedClassroomId = 'all';
    selectedStudentIds = [];
    selectedFiles = [];
    uploadError = '';
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    showEmojiPicker = false;
  }

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
      textareaEl.focus();
      showEmojiPicker = false;
    }
    node.addEventListener('emoji-click', handler);
    return {
      destroy() { node.removeEventListener('emoji-click', handler); }
    };
  }

  function toggleStudent(studentId: string) {
    if (selectedStudentIds.includes(studentId)) {
      selectedStudentIds = selectedStudentIds.filter((id) => id !== studentId);
    } else {
      selectedStudentIds = [...selectedStudentIds, studentId];
    }
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    uploading = true;
    uploadError = '';

    const formData = new FormData(e.target as HTMLFormElement);
    const body = formData.get('body') as string;

    if (!body?.trim()) {
      uploadError = 'Message is required';
      uploading = false;
      return;
    }

    try {
      let signedBlobIds: string[] = [];
      if (selectedFiles.length > 0) {
        signedBlobIds = await uploadFiles(selectedFiles);
      }

      const classroomIds = isAllClasses
        ? data.classrooms.map((c) => c.id)
        : [selectedClassroomId];

      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation CreateFeedPost($classroomIds: [ID!]!, $body: String!, $signedBlobIds: [String!], $studentIds: [ID!]) {
            createFeedPost(classroomIds: $classroomIds, body: $body, signedBlobIds: $signedBlobIds, studentIds: $studentIds) {
              feedPosts { id }
              errors { message path }
            }
          }`,
          variables: {
            classroomIds,
            body: body.trim(),
            signedBlobIds,
            studentIds: selectedStudentIds.length > 0 ? selectedStudentIds : null
          }
        })
      });

      const json = await res.json();
      const errors = json.data?.createFeedPost?.errors;

      if (errors?.length > 0) {
        uploadError = errors[0].message;
      } else {
        window.location.reload();
      }
    } catch (err) {
      uploadError = err instanceof Error ? err.message : 'Upload failed';
    } finally {
      uploading = false;
    }
  }
</script>

<svelte:head>
  <title>Class Feed — GrewMe</title>
</svelte:head>

<div class="max-w-2xl mx-auto">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl font-bold text-text">Class Feed</h1>
    <Button onclick={openModal}>+ New Post</Button>
  </div>

  <!-- Recent Posts -->
  {#if data.feedPosts.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p>No posts yet. Create your first update!</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each data.feedPosts as post (post.id)}
        <FeedCard {post} />
      {/each}
    </div>
  {/if}
</div>

<!-- ── Create Post Modal ──────────────────────────────────────────────────── -->
{#if showModal}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    onkeydown={(e) => { if (e.key === 'Escape') closeModal(); }}
  >
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="absolute inset-0" onclick={closeModal}></div>

    <!-- Modal content -->
    <div class="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-text">Create Post</h2>
        <button
          type="button"
          onclick={closeModal}
          class="p-1 rounded-lg text-text-muted hover:text-text hover:bg-slate-100 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {#if uploadError}
        <div class="mb-4">
          <Alert variant="error">{uploadError}</Alert>
        </div>
      {/if}

      <form onsubmit={handleSubmit} class="space-y-4">
        <div>
          <label for="modal-classroomId" class="block text-sm font-medium text-text mb-1">Classroom</label>
          <select
            id="modal-classroomId"
            bind:value={selectedClassroomId}
            required
            disabled={uploading}
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All Classes</option>
            {#each data.classrooms as classroom}
              <option value={classroom.id}>{classroom.name}</option>
            {/each}
          </select>
          {#if isAllClasses}
            <p class="text-xs text-text-muted mt-1">All parents across your classes will see this post</p>
          {/if}
        </div>

        {#if !isAllClasses && classroomStudents.length > 0}
          <div>
            <label class="block text-sm font-medium text-text mb-1">
              Tag students <span class="text-text-muted font-normal">(optional)</span>
            </label>
            <div class="flex flex-wrap gap-2">
              {#each classroomStudents as student}
                <button
                  type="button"
                  disabled={uploading}
                  onclick={() => toggleStudent(student.id)}
                  class="px-3 py-1.5 rounded-full text-sm font-medium transition-colors {selectedStudentIds.includes(student.id) ? 'bg-primary text-white' : 'bg-slate-100 text-text-muted hover:bg-slate-200'} disabled:opacity-50"
                >
                  {student.name}
                </button>
              {/each}
            </div>
            {#if selectedStudentIds.length > 0}
              <p class="text-xs text-text-muted mt-1">{selectedStudentIds.length} student{selectedStudentIds.length > 1 ? 's' : ''} tagged</p>
            {/if}
          </div>
        {/if}

        <!-- File previews (above input bar, like WhatsApp) -->
        {#if selectedFiles.length > 0}
          <div class="flex flex-wrap gap-2">
            {#each selectedFiles as file, i}
              <div class="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                {#if file.type.startsWith('image/')}
                  <img src={URL.createObjectURL(file)} alt={file.name} class="w-full h-full object-cover" />
                {:else}
                  <div class="flex flex-col items-center justify-center h-full p-1">
                    <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span class="text-[9px] text-slate-500 truncate w-full text-center mt-0.5">{file.name.split('.').pop()}</span>
                  </div>
                {/if}
                <button
                  type="button"
                  onclick={() => { selectedFiles = selectedFiles.filter((_, idx) => idx !== i); }}
                  class="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >&times;</button>
              </div>
            {/each}
          </div>
        {/if}

        <!-- Message input with inline icons -->
        <div class="flex items-end gap-2">
          <div class="relative flex-1">
            <textarea
              bind:this={textareaEl}
              name="body"
              id="modal-body"
              required
              rows={3}
              disabled={uploading}
              placeholder="Type a message..."
              class="w-full border border-slate-200 rounded-2xl px-4 pt-2.5 pb-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            ></textarea>
            <!-- Icons inside textarea, bottom-right -->
            <div class="absolute bottom-2 right-2 flex items-center gap-0.5">
              <!-- Attach file -->
              <button
                type="button"
                disabled={uploading || selectedFiles.length >= 4}
                onclick={() => fileInput.click()}
                class="p-1 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Attach file"
              >
                <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <!-- Camera -->
              <button
                type="button"
                disabled={uploading || selectedFiles.length >= 4}
                onclick={() => cameraInput.click()}
                class="p-1 rounded-full text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Take photo"
              >
                <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </button>
              <!-- Emoji -->
              <div class="relative">
                <button
                  type="button"
                  disabled={uploading}
                  onclick={() => showEmojiPicker = !showEmojiPicker}
                  class="p-1 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed {showEmojiPicker ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-primary hover:bg-primary/10'}"
                  title="Emoji"
                >
                  <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
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
            </div>
          </div>

          <!-- Send button -->
          <button
            type="submit"
            disabled={uploading}
            class="p-2.5 mb-1.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Send"
          >
            {#if uploading}
              <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            {:else}
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            {/if}
          </button>
        </div>

        <!-- Hidden file inputs -->
        <input
          bind:this={fileInput}
          type="file"
          accept="image/*,video/*"
          multiple
          class="hidden"
          onchange={(e) => {
            const input = e.target as HTMLInputElement;
            if (input.files) {
              selectedFiles = [...selectedFiles, ...Array.from(input.files)].slice(0, 4);
              input.value = '';
            }
          }}
        />
        <input
          bind:this={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          class="hidden"
          onchange={(e) => {
            const input = e.target as HTMLInputElement;
            if (input.files) {
              selectedFiles = [...selectedFiles, ...Array.from(input.files)].slice(0, 4);
              input.value = '';
            }
          }}
        />

        <div class="flex justify-end">
          <Button variant="ghost" type="button" onclick={closeModal} disabled={uploading}>Cancel</Button>
        </div>
      </form>
    </div>
  </div>
{/if}
