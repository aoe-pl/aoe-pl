import { minioClient, type BucketName } from "./s3-client";

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export interface ListOptions {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
}

export class S3Service {
  private bucket: BucketName;

  constructor(bucket: BucketName) {
    this.bucket = bucket;
  }

  /**
   * Upload a file to Minio
   */
  async upload(
    key: string,
    data: Buffer | string,
    options: UploadOptions = {},
  ): Promise<string> {
    const { contentType, metadata } = options;

    const minioMetadata = {
      ...metadata,
      ...(contentType && { "content-type": contentType }),
    };

    await minioClient.putObject(
      this.bucket,
      key,
      data,
      undefined,
      minioMetadata,
    );
    return key;
  }

  /**
   * Download a file from Minio
   */
  async download(key: string): Promise<Buffer> {
    const stream = await minioClient.getObject(this.bucket, key);

    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", reject);
    });
  }

  /**
   * Get file as stream
   */
  async getStream(key: string): Promise<NodeJS.ReadableStream> {
    return await minioClient.getObject(this.bucket, key);
  }

  /**
   * Delete a file from Minio
   */
  async delete(key: string): Promise<void> {
    await minioClient.removeObject(this.bucket, key);
  }

  /**
   * List objects in the bucket
   */
  async list(options: ListOptions = {}): Promise<{
    objects: Array<{ key: string; size: number; lastModified: Date }>;
    continuationToken?: string;
    isTruncated: boolean;
  }> {
    const { prefix, maxKeys } = options;

    const objects: Array<{ key: string; size: number; lastModified: Date }> =
      [];

    return new Promise((resolve, reject) => {
      const stream = minioClient.listObjects(this.bucket, prefix, true);

      stream.on("data", (obj) => {
        objects.push({
          key: obj.name!,
          size: obj.size!,
          lastModified: obj.lastModified!,
        });

        if (maxKeys && objects.length >= maxKeys) {
          stream.destroy();
        }
      });

      stream.on("end", () => {
        resolve({
          objects,
          isTruncated: false,
        });
      });

      stream.on("error", reject);
    });
  }

  /**
   * Check if a file exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      await minioClient.statObject(this.bucket, key);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(key: string): Promise<{
    contentType?: string;
    contentLength?: number;
    lastModified?: Date;
    metadata?: Record<string, string>;
  }> {
    const stat = await minioClient.statObject(this.bucket, key);

    return {
      contentType: stat.metaData?.["content-type"] as string | undefined,
      contentLength: stat.size,
      lastModified: stat.lastModified,
      metadata: stat.metaData,
    };
  }

  /**
   * Generate a presigned URL for upload
   */
  async getPresignedUploadUrl(
    key: string,
    options: PresignedUrlOptions = {},
  ): Promise<string> {
    const { expiresIn = 3600 } = options;

    return await minioClient.presignedPutObject(this.bucket, key, expiresIn);
  }

  /**
   * Generate a presigned URL for download
   */
  async getPresignedDownloadUrl(
    key: string,
    options: PresignedUrlOptions = {},
  ): Promise<string> {
    const { expiresIn = 3600 } = options;

    return await minioClient.presignedGetObject(this.bucket, key, expiresIn);
  }

  /**
   * Copy a file within the same bucket
   */
  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    await minioClient.copyObject(
      this.bucket,
      destinationKey,
      `/${this.bucket}/${sourceKey}`,
    );
  }
}
