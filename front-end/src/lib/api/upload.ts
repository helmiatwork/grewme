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

  // BFF proxy returns { errors: [...] } without data on auth/server errors
  if (json.errors?.length > 0) {
    throw new Error(json.errors[0].message);
  }

  if (!json.data?.createDirectUpload?.directUpload) {
    throw new Error('Upload failed: unexpected server response');
  }

  const { directUpload: upload, errors } = json.data.createDirectUpload;

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
