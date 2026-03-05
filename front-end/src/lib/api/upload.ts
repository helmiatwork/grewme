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
 * Uses SubtleCrypto where available, falls back to manual computation.
 */
async function computeChecksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  // SubtleCrypto doesn't support MD5 in all browsers, use a simple approach
  // We'll use the spark-md5 approach inline or just send the file and let Rails handle it
  // Actually, Active Storage requires MD5. Let's compute it properly.
  const bytes = new Uint8Array(buffer);
  
  // Simple MD5 implementation for browser - we need to use a different approach
  // The Web Crypto API doesn't support MD5. We'll compute it server-side instead.
  // For now, use a workaround: compute via the server or use a library.
  
  // Actually, the simplest approach: use the FileReader + crypto polyfill
  // But for production, we should use spark-md5. For now, let's use a basic approach.
  // We'll install spark-md5.
  const { default: SparkMD5 } = await import('spark-md5');
  const spark = new SparkMD5.ArrayBuffer();
  spark.append(buffer);
  const hexHash = spark.end();
  
  // Convert hex to base64
  const hashBytes = new Uint8Array(hexHash.match(/.{2}/g)!.map((byte: string) => parseInt(byte, 16)));
  return btoa(String.fromCharCode(...hashBytes));
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
