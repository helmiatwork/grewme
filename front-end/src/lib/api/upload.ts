interface UploadResult {
  signedBlobId: string;
}

/**
 * Compute MD5 checksum of a file as base64 (required by Active Storage).
 * Web Crypto API doesn't support MD5, so we use spark-md5.
 */
async function computeChecksum(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const { default: SparkMD5 } = await import('spark-md5');
  const spark = new SparkMD5.ArrayBuffer();
  spark.append(buffer);
  const hexHash = spark.end();
  const hashBytes = new Uint8Array(
    hexHash.match(/.{2}/g)!.map((byte: string) => parseInt(byte, 16))
  );
  return btoa(String.fromCharCode(...hashBytes));
}

/**
 * Upload a single file via BFF proxy:
 * 1. Compute MD5 checksum
 * 2. Send file + checksum to /api/upload (SvelteKit server)
 * 3. Server handles GraphQL mutation + S3 PUT (no CORS issues)
 * 4. Return signed blob ID
 */
export async function uploadFile(file: File): Promise<UploadResult> {
  const checksum = await computeChecksum(file);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('checksum', checksum);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    throw new Error(json.error || `Upload failed: ${res.status}`);
  }

  return { signedBlobId: json.signedBlobId };
}

/**
 * Upload multiple files in parallel, return signed blob IDs.
 */
export async function uploadFiles(files: File[]): Promise<string[]> {
  const results = await Promise.all(files.map(uploadFile));
  return results.map((r) => r.signedBlobId);
}
