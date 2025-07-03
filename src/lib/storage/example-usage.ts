import { createAoe2RecsService } from "./index";

// Example usage of the S3 abstraction layer

/**
 * Example: Upload a replay file
 */
export async function uploadReplayFile(
  fileName: string,
  fileData: Buffer,
  playerName: string,
  tournamentId?: string,
): Promise<string> {
  const s3Service = createAoe2RecsService();

  // Create a structured key for the replay file
  const key = tournamentId
    ? `tournaments/${tournamentId}/replays/${fileName}`
    : `replays/${fileName}`;

  // Upload with metadata
  const uploadedKey = await s3Service.upload(key, fileData, {
    contentType: "application/octet-stream",
    metadata: {
      playerName,
      uploadDate: new Date().toISOString(),
      ...(tournamentId && { tournamentId }),
    },
  });

  return uploadedKey;
}

/**
 * Example: Get a presigned URL for client-side upload
 */
export async function getReplayUploadUrl(
  fileName: string,
  tournamentId?: string,
): Promise<string> {
  const s3Service = createAoe2RecsService();

  const key = tournamentId
    ? `tournaments/${tournamentId}/replays/${fileName}`
    : `replays/${fileName}`;

  return s3Service.getPresignedUploadUrl(key, {
    expiresIn: 3600, // 1 hour
    contentType: "application/octet-stream",
  });
}

/**
 * Example: Get a presigned URL for secure download
 */
export async function getReplayDownloadUrl(key: string): Promise<string> {
  const s3Service = createAoe2RecsService();

  return s3Service.getPresignedDownloadUrl(key, {
    expiresIn: 1800, // 30 minutes
  });
}

/**
 * Example: List all replay files for a tournament
 */
export async function listTournamentReplays(tournamentId: string) {
  const s3Service = createAoe2RecsService();

  const result = await s3Service.list({
    prefix: `tournaments/${tournamentId}/replays/`,
    maxKeys: 100,
  });

  return result.objects.map((obj) => ({
    key: obj.key,
    size: obj.size,
    lastModified: obj.lastModified,
    fileName: obj.key.split("/").pop(),
  }));
}

/**
 * Example: Delete a replay file
 */
export async function deleteReplayFile(key: string): Promise<void> {
  const s3Service = createAoe2RecsService();

  await s3Service.delete(key);
}

/**
 * Example: Check if a replay file exists
 */
export async function replayExists(key: string): Promise<boolean> {
  const s3Service = createAoe2RecsService();

  return s3Service.exists(key);
}

/**
 * Example: Get replay file metadata
 */
export async function getReplayMetadata(key: string) {
  const s3Service = createAoe2RecsService();

  return s3Service.getMetadata(key);
}
