# Media Upload for Teacher Feed Posts

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add file upload capability to the teacher feed post creation form so teachers can attach images/videos to posts.

**Architecture:** GraphQL `createDirectUpload` mutation returns a presigned S3 URL + signed blob ID. Frontend uploads files directly to S3/Minio via presigned URL, then passes signed blob IDs to the existing `createFeedPost` mutation. This avoids CORS issues (no direct browser→Rails Active Storage endpoint needed).

**Tech Stack:** Rails Active Storage direct uploads via GraphQL, SvelteKit form with file picker, presigned S3 PUT.

---

### Task 1: Backend — `createDirectUpload` GraphQL Mutation

**Files:**
- Create: `backend/app/graphql/mutations/create_direct_upload.rb`
- Create: `backend/app/graphql/types/direct_upload_type.rb`
- Modify: `backend/app/graphql/types/mutation_type.rb`

**Step 1: Create DirectUploadType**

Create `backend/app/graphql/types/direct_upload_type.rb`:

```ruby
# frozen_string_literal: true

module Types
  class DirectUploadType < Types::BaseObject
    field :url, String, null: false, description: "Presigned upload URL for PUT request"
    field :headers, String, null: false, description: "JSON string of required headers for the upload"
    field :signed_blob_id, String, null: false, description: "Signed blob ID to attach after upload"
  end
end
```

**Step 2: Create CreateDirectUpload mutation**

Create `backend/app/graphql/mutations/create_direct_upload.rb`:

```ruby
# frozen_string_literal: true

module Mutations
  class CreateDirectUpload < BaseMutation
    argument :filename, String, required: true
    argument :byte_size, Integer, required: true
    argument :content_type, String, required: true
    argument :checksum, String, required: true

    field :direct_upload, Types::DirectUploadType
    field :errors, [Types::UserErrorType], null: false

    def resolve(filename:, byte_size:, content_type:, checksum:)
      authenticate!
      raise Pundit::NotAuthorizedError unless current_user.teacher?

      blob = ActiveStorage::Blob.create_before_direct_upload!(
        filename: filename,
        byte_size: byte_size,
        content_type: content_type,
        checksum: checksum
      )

      {
        direct_upload: {
          url: blob.service_url_for_direct_upload,
          headers: blob.service_headers_for_direct_upload.to_json,
          signed_blob_id: blob.signed_id
        },
        errors: []
      }
    end
  end
end
```

**Step 3: Register mutation in MutationType**

In `backend/app/graphql/types/mutation_type.rb`, add:

```ruby
field :create_direct_upload, mutation: Mutations::CreateDirectUpload
```

**Step 4: Commit**

```bash
git add backend/app/graphql/mutations/create_direct_upload.rb \
       backend/app/graphql/types/direct_upload_type.rb \
       backend/app/graphql/types/mutation_type.rb
git commit -m "feat(upload): add createDirectUpload GraphQL mutation"
```

---

### Task 2: Backend — Test `createDirectUpload` Mutation

**Files:**
- Create: `backend/test/graphql/mutations/direct_upload_test.rb`

**Step 1: Write tests**

Create `backend/test/graphql/mutations/direct_upload_test.rb`:

```ruby
# frozen_string_literal: true

require "test_helper"

class DirectUploadMutationTest < ActiveSupport::TestCase
  MUTATION = <<~GQL
    mutation CreateDirectUpload($filename: String!, $byteSize: Int!, $contentType: String!, $checksum: String!) {
      createDirectUpload(filename: $filename, byteSize: $byteSize, contentType: $contentType, checksum: $checksum) {
        directUpload { url headers signedBlobId }
        errors { message path }
      }
    }
  GQL

  test "teacher can create direct upload" do
    result = execute_query(
      mutation: MUTATION,
      variables: { filename: "photo.jpg", byteSize: 1024, contentType: "image/jpeg", checksum: Base64.strict_encode64(Digest::MD5.digest("test")) },
      user: teachers(:teacher_alice)
    )

    upload = result.dig("data", "createDirectUpload", "directUpload")
    assert upload["url"].present?
    assert upload["signedBlobId"].present?
    assert JSON.parse(upload["headers"]).is_a?(Hash)
    assert_empty result.dig("data", "createDirectUpload", "errors")
  end

  test "parent cannot create direct upload" do
    assert_raises(Pundit::NotAuthorizedError) do
      execute_query(
        mutation: MUTATION,
        variables: { filename: "photo.jpg", byteSize: 1024, contentType: "image/jpeg", checksum: Base64.strict_encode64(Digest::MD5.digest("test")) },
        user: parents(:parent_carol)
      )
    end
  end

  test "unauthenticated user cannot create direct upload" do
    assert_raises(GraphQL::ExecutionError) do
      execute_query(
        mutation: MUTATION,
        variables: { filename: "photo.jpg", byteSize: 1024, contentType: "image/jpeg", checksum: Base64.strict_encode64(Digest::MD5.digest("test")) }
      )
    end
  end
end
```

**Step 2: Run tests**

Run: `bin/rails test test/graphql/mutations/direct_upload_test.rb -v`
Expected: 3 tests, 0 failures

**Step 3: Commit**

```bash
git add backend/test/graphql/mutations/direct_upload_test.rb
git commit -m "test(upload): add createDirectUpload mutation tests"
```

---

### Task 3: Frontend — Upload Utility + GraphQL Queries

**Files:**
- Create: `front-end/src/lib/api/upload.ts`
- Modify: `front-end/src/lib/api/queries/feed.ts`

**Step 1: Add GraphQL mutation string**

In `front-end/src/lib/api/queries/feed.ts`, add at the end:

```typescript
export const CREATE_DIRECT_UPLOAD_MUTATION = `
  mutation CreateDirectUpload($filename: String!, $byteSize: Int!, $contentType: String!, $checksum: String!) {
    createDirectUpload(filename: $filename, byteSize: $byteSize, contentType: $contentType, checksum: $checksum) {
      directUpload { url headers signedBlobId }
      errors { message path }
    }
  }
`;
```

**Step 2: Create upload utility**

Create `front-end/src/lib/api/upload.ts`:

```typescript
import { CREATE_DIRECT_UPLOAD_MUTATION } from './queries/feed';

interface DirectUpload {
  url: string;
  headers: string;
  signedBlobId: string;
}

interface UploadResult {
  signedBlobId: string;
}

/**
 * Compute MD5 checksum of a file as base64 (required by Active Storage).
 */
async function computeChecksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('MD5', buffer);
  const bytes = new Uint8Array(hashBuffer);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Upload a single file via Active Storage direct upload:
 * 1. Call createDirectUpload mutation to get presigned URL
 * 2. PUT the file to S3/Minio using the presigned URL
 * 3. Return the signed blob ID
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  const checksum = await computeChecksum(file);

  // Step 1: Get presigned URL via BFF proxy
  const res = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: CREATE_DIRECT_UPLOAD_MUTATION,
      variables: {
        filename: file.name,
        byteSize: file.size,
        contentType: file.type || 'application/octet-stream',
        checksum
      }
    })
  });

  const json = await res.json();
  const upload: DirectUpload = json.data.createDirectUpload.directUpload;
  const errors = json.data.createDirectUpload.errors;

  if (errors?.length > 0) {
    throw new Error(errors[0].message);
  }

  // Step 2: PUT file to S3 using presigned URL
  const headers: Record<string, string> = JSON.parse(upload.headers);
  headers['Content-Type'] = file.type || 'application/octet-stream';

  const putRes = await fetch(upload.url, {
    method: 'PUT',
    headers,
    body: file
  });

  if (!putRes.ok) {
    throw new Error(`Upload failed: ${putRes.status}`);
  }

  return { signedBlobId: upload.signedBlobId };
}

/**
 * Upload multiple files in parallel, return signed blob IDs.
 */
export async function uploadFiles(files: File[]): Promise<string[]> {
  const results = await Promise.all(files.map(uploadFile));
  return results.map((r) => r.signedBlobId);
}
```

**Step 3: Commit**

```bash
git add front-end/src/lib/api/upload.ts front-end/src/lib/api/queries/feed.ts
git commit -m "feat(upload): add frontend upload utility and GraphQL query"
```

---

### Task 4: Frontend — File Picker Component

**Files:**
- Create: `front-end/src/lib/components/feed/FilePicker.svelte`
- Modify: `front-end/src/lib/components/feed/index.ts`

**Step 1: Create FilePicker component**

Create `front-end/src/lib/components/feed/FilePicker.svelte`:

```svelte
<script lang="ts">
  interface Props {
    files: File[];
    onchange: (files: File[]) => void;
    disabled?: boolean;
    maxFiles?: number;
    accept?: string;
  }

  let { files, onchange, disabled = false, maxFiles = 4, accept = 'image/*,video/*' }: Props = $props();

  let inputEl: HTMLInputElement;

  function handleChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;

    const newFiles = [...files, ...Array.from(input.files)].slice(0, maxFiles);
    onchange(newFiles);
    input.value = '';
  }

  function removeFile(index: number) {
    const newFiles = files.filter((_, i) => i !== index);
    onchange(newFiles);
  }

  function isImage(file: File): boolean {
    return file.type.startsWith('image/');
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
</script>

<div class="space-y-3">
  {#if files.length > 0}
    <div class="flex flex-wrap gap-2">
      {#each files as file, i}
        <div class="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
          {#if isImage(file)}
            <img src={URL.createObjectURL(file)} alt={file.name} class="w-full h-full object-cover" />
          {:else}
            <div class="flex flex-col items-center justify-center h-full p-1">
              <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span class="text-[10px] text-slate-500 truncate w-full text-center mt-1">{formatSize(file.size)}</span>
            </div>
          {/if}
          <button
            type="button"
            onclick={() => removeFile(i)}
            class="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove {file.name}"
          >
            &times;
          </button>
        </div>
      {/each}
    </div>
  {/if}

  {#if files.length < maxFiles}
    <button
      type="button"
      onclick={() => inputEl.click()}
      {disabled}
      class="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
      Attach media ({files.length}/{maxFiles})
    </button>
    <input
      bind:this={inputEl}
      type="file"
      {accept}
      multiple
      class="hidden"
      onchange={handleChange}
    />
  {/if}
</div>
```

**Step 2: Export from index.ts**

In `front-end/src/lib/components/feed/index.ts`, add:

```typescript
export { default as FilePicker } from './FilePicker.svelte';
```

**Step 3: Commit**

```bash
git add front-end/src/lib/components/feed/FilePicker.svelte \
       front-end/src/lib/components/feed/index.ts
git commit -m "feat(upload): add FilePicker component"
```

---

### Task 5: Frontend — Wire Upload into Teacher Feed Page

**Files:**
- Modify: `front-end/src/routes/teacher/feed/+page.svelte`
- Modify: `front-end/src/routes/teacher/feed/+page.server.ts`

**Step 1: Update +page.svelte to include file picker and client-side upload**

Replace `front-end/src/routes/teacher/feed/+page.svelte` with:

```svelte
<script lang="ts">
  import { Card, Button, Alert } from '$lib/components/ui';
  import { FeedCard, FilePicker } from '$lib/components/feed';
  import { uploadFiles } from '$lib/api/upload';

  let { data, form } = $props();

  let selectedFiles: File[] = $state([]);
  let uploading = $state(false);
  let uploadError = $state('');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    uploading = true;
    uploadError = '';

    const formData = new FormData(e.target as HTMLFormElement);
    const classroomId = formData.get('classroomId') as string;
    const body = formData.get('body') as string;

    if (!classroomId || !body?.trim()) {
      uploadError = 'Classroom and message are required';
      uploading = false;
      return;
    }

    try {
      // Upload files first if any
      let signedBlobIds: string[] = [];
      if (selectedFiles.length > 0) {
        signedBlobIds = await uploadFiles(selectedFiles);
      }

      // Create post via BFF proxy
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation CreateFeedPost($classroomId: ID!, $body: String!, $signedBlobIds: [String!]) {
            createFeedPost(classroomId: $classroomId, body: $body, signedBlobIds: $signedBlobIds) {
              feedPost { id }
              errors { message path }
            }
          }`,
          variables: { classroomId, body: body.trim(), signedBlobIds }
        })
      });

      const json = await res.json();
      const errors = json.data?.createFeedPost?.errors;

      if (errors?.length > 0) {
        uploadError = errors[0].message;
      } else {
        // Success — reload page
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

      {#if form?.error || uploadError}
        <Alert variant="error">{form?.error || uploadError}</Alert>
      {/if}

      <form onsubmit={handleSubmit} class="space-y-4">
        <div>
          <label for="classroomId" class="block text-sm font-medium text-text mb-1">Classroom</label>
          <select
            name="classroomId"
            id="classroomId"
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
```

**Step 2: Simplify +page.server.ts (remove form action, keep load only)**

The form now submits client-side via fetch, so the server action is no longer needed. Replace `front-end/src/routes/teacher/feed/+page.server.ts`:

```typescript
import type { PageServerLoad } from './$types';
import { graphql } from '$lib/api/client';
import { CLASSROOMS_QUERY } from '$lib/api/queries/classrooms';
import { FEED_POSTS_QUERY } from '$lib/api/queries/feed';
import type { Classroom, FeedPost, Connection } from '$lib/api/types';

export const load: PageServerLoad = async ({ locals }) => {
  const [classroomsData, feedData] = await Promise.all([
    graphql<{ classrooms: Classroom[] }>(CLASSROOMS_QUERY, {}, locals.accessToken!),
    graphql<{ feedPosts: Connection<FeedPost> }>(FEED_POSTS_QUERY, { first: 20 }, locals.accessToken!)
  ]);

  return {
    classrooms: classroomsData.classrooms,
    feedPosts: feedData.feedPosts.nodes
  };
};
```

**Step 3: Commit**

```bash
git add front-end/src/routes/teacher/feed/+page.svelte \
       front-end/src/routes/teacher/feed/+page.server.ts
git commit -m "feat(upload): wire file upload into teacher feed page"
```

---

### Task 6: Backend — Configure Minio CORS for Direct Upload

**Files:**
- Modify: `docker-compose.yml` (add Minio CORS init)

**Step 1: Ensure Minio allows PUT from browser**

The presigned URL points to Minio (localhost:9000). The browser needs CORS permission to PUT. Add an init container or mc command. Simplest: add a script that runs after Minio starts.

Create `backend/bin/setup-minio-cors`:

```bash
#!/bin/bash
# Wait for Minio to be ready
until curl -sf http://localhost:9000/minio/health/live; do sleep 1; done

# Install mc if not present, configure, and set CORS
mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null

# Create bucket if not exists
mc mb local/grewme-dev --ignore-existing

# Set CORS policy
mc anonymous set download local/grewme-dev

cat > /tmp/cors.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["http://localhost:5173"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

# Apply CORS via S3 API
aws --endpoint-url http://localhost:9000 s3api put-bucket-cors \
  --bucket grewme-dev \
  --cors-configuration file:///tmp/cors.json \
  2>/dev/null || echo "CORS set via mc or manual config needed"

echo "Minio setup complete"
```

**Note:** If `aws` CLI is not available, CORS can be set via Minio Console at http://localhost:9001 → Buckets → grewme-dev → Access Rules. For dev, the simplest approach is to set the bucket policy to allow public read/write.

**Step 2: Commit**

```bash
chmod +x backend/bin/setup-minio-cors
git add backend/bin/setup-minio-cors
git commit -m "chore: add Minio CORS setup script for direct uploads"
```

---

### Task 7: Verify — Run All Tests + Build

**Step 1: Run backend tests**

Run: `bin/rails test -v` (from `backend/`)
Expected: All tests pass (including new direct_upload_test.rb)

**Step 2: Run svelte-check**

Run: `npx svelte-check --tsconfig ./tsconfig.json` (from `front-end/`)
Expected: 0 errors

**Step 3: Run vite build**

Run: `npm run build` (from `front-end/`)
Expected: Build succeeds

**Step 4: Manual smoke test**

1. Start Minio: `docker compose up -d minio`
2. Run setup script: `backend/bin/setup-minio-cors`
3. Start Rails: `bin/rails s -p 3004` (from `backend/`)
4. Start SvelteKit: `npm run dev` (from `front-end/`)
5. Login as teacher (alice@greenwood.edu / password123)
6. Go to /teacher/feed
7. Write a message, attach an image, click "Post Update"
8. Verify image appears in the feed
