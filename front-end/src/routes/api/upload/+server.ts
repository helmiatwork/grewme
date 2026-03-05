import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { graphql } from '$lib/api/client';
import { getAccessToken } from '$lib/api/auth';
import { CREATE_DIRECT_UPLOAD_MUTATION } from '$lib/api/queries/feed';

interface DirectUploadResponse {
  createDirectUpload: {
    directUpload: { url: string; headers: string; signedBlobId: string } | null;
    errors: { message: string }[];
  };
}

/**
 * BFF upload proxy: browser sends file here, server PUTs to S3/Minio.
 * Avoids CORS issues since the S3 PUT is server-to-server.
 *
 * Flow:
 * 1. Receive file + metadata from browser (multipart form)
 * 2. Call createDirectUpload GraphQL mutation to get presigned URL
 * 3. PUT file to S3 using presigned URL (server-side, no CORS)
 * 4. Return signedBlobId to browser
 */
export const POST: RequestHandler = async ({ request, cookies }) => {
  const token = getAccessToken(cookies);
  if (!token) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const checksum = formData.get('checksum') as string | null;

    if (!file || !checksum) {
      return json({ error: 'file and checksum are required' }, { status: 400 });
    }

    // Step 1: Get presigned URL from Rails
    const result = await graphql<DirectUploadResponse>(
      CREATE_DIRECT_UPLOAD_MUTATION,
      {
        filename: file.name,
        byteSize: file.size,
        contentType: file.type || 'application/octet-stream',
        checksum
      },
      token
    );

    const { directUpload, errors } = result.createDirectUpload;

    if (errors.length > 0) {
      return json({ error: errors[0].message }, { status: 400 });
    }

    if (!directUpload) {
      return json({ error: 'Failed to create upload' }, { status: 500 });
    }

    // Step 2: PUT file to S3 (server-side — no CORS)
    const s3Headers: Record<string, string> = JSON.parse(directUpload.headers);
    s3Headers['Content-Type'] = file.type || 'application/octet-stream';

    const putRes = await fetch(directUpload.url, {
      method: 'PUT',
      headers: s3Headers,
      body: file
    });

    if (!putRes.ok) {
      const body = await putRes.text();
      return json({ error: `S3 upload failed: ${putRes.status} ${body}` }, { status: 502 });
    }

    // Step 3: Return signed blob ID
    return json({ signedBlobId: directUpload.signedBlobId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    return json({ error: message }, { status: 500 });
  }
};
