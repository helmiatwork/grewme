<script lang="ts">
  import { Button, Alert } from '$lib/components/ui';
  import { FeedCard, FilePicker } from '$lib/components/feed';
  import { uploadFiles } from '$lib/api/upload';

  let { data } = $props();

  let showModal = $state(false);
  let selectedFiles: File[] = $state([]);
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

        <div>
          <label for="modal-body" class="block text-sm font-medium text-text mb-1">Message</label>
          <textarea
            name="body"
            id="modal-body"
            required
            rows={4}
            disabled={uploading}
            placeholder="Share an update with parents..."
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          ></textarea>
        </div>

        <FilePicker
          files={selectedFiles}
          onchange={(f) => selectedFiles = f}
          disabled={uploading}
        />

        <div class="flex gap-3 justify-end">
          <Button variant="ghost" type="button" onclick={closeModal} disabled={uploading}>Cancel</Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Post Update'}
          </Button>
        </div>
      </form>
    </div>
  </div>
{/if}
