<script lang="ts">
  import { Card, Button, Alert } from '$lib/components/ui';
  import { FeedCard, FilePicker } from '$lib/components/feed';
  import { uploadFiles } from '$lib/api/upload';

  let { data } = $props();

  let selectedFiles: File[] = $state([]);
  let uploading = $state(false);
  let uploadError = $state('');
  let selectedClassroomId = $state('');
  let selectedStudentIds: string[] = $state([]);

  // Get students for the selected classroom
  const classroomStudents = $derived(
    data.classrooms.find((c) => c.id === selectedClassroomId)?.students ?? []
  );

  // Reset student selection when classroom changes
  $effect(() => {
    selectedClassroomId;
    selectedStudentIds = [];
  });

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

    if (!selectedClassroomId || !body?.trim()) {
      uploadError = 'Classroom and message are required';
      uploading = false;
      return;
    }

    try {
      let signedBlobIds: string[] = [];
      if (selectedFiles.length > 0) {
        signedBlobIds = await uploadFiles(selectedFiles);
      }

      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation CreateFeedPost($classroomId: ID!, $body: String!, $signedBlobIds: [String!], $studentIds: [ID!]) {
            createFeedPost(classroomId: $classroomId, body: $body, signedBlobIds: $signedBlobIds, studentIds: $studentIds) {
              feedPost { id }
              errors { message path }
            }
          }`,
          variables: {
            classroomId: selectedClassroomId,
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
  <h1 class="text-2xl font-bold text-text mb-6">Class Feed</h1>

  <!-- Create Post Form -->
  <Card class="mb-8">
    {#snippet children()}
      <h2 class="text-lg font-semibold text-text mb-4">Create Post</h2>

      {#if uploadError}
        <Alert variant="error">{uploadError}</Alert>
      {/if}

      <form onsubmit={handleSubmit} class="space-y-4">
        <div>
          <label for="classroomId" class="block text-sm font-medium text-text mb-1">Classroom</label>
          <select
            id="classroomId"
            bind:value={selectedClassroomId}
            required
            disabled={uploading}
            class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Select classroom...</option>
            {#each data.classrooms as classroom}
              <option value={classroom.id}>{classroom.name}</option>
            {/each}
          </select>
        </div>

        {#if classroomStudents.length > 0}
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
          <label for="body" class="block text-sm font-medium text-text mb-1">Message</label>
          <textarea
            name="body"
            id="body"
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

        <Button type="submit" disabled={uploading}>
          {#if uploading}
            Uploading...
          {:else}
            Post Update
          {/if}
        </Button>
      </form>
    {/snippet}
  </Card>

  <!-- Recent Posts -->
  <h2 class="text-lg font-semibold text-text mb-4">Recent Posts</h2>

  {#if data.feedPosts.length === 0}
    <div class="text-center py-12 text-text-muted">
      <p>No posts yet. Create your first update above!</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each data.feedPosts as post (post.id)}
        <FeedCard {post} />
      {/each}
    </div>
  {/if}
</div>
