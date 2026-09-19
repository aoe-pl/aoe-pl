/**
 * Client-side helper for uploading files to the shared storage bucket.
 *
 * This talks to the `/api/storage/upload` endpoint.
 */

export interface UploadFileParams {
  file: File;
  path: string; // Destination folder prefix inside the bucket, e.g. "tournaments/foo/images".
  fileName?: string;
}

export interface UploadFileResult {
  key: string;
  fileName: string;
  fileSize: number;
}

export async function uploadFile({
  file,
  path,
  fileName,
}: UploadFileParams): Promise<UploadFileResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("path", path);
  if (fileName) {
    formData.append("fileName", fileName);
  }

  const response = await fetch("/api/storage/upload", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as Partial<UploadFileResult> & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Failed to upload file");
  }

  return data as UploadFileResult;
}
