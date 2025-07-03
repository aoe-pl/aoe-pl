import { BUCKETS, type BucketName } from "./s3-client";
import { S3Service } from "./s3-service";

export { minioClient, BUCKETS, type BucketName } from "./s3-client";
export { S3Service } from "./s3-service";
export type {
  UploadOptions,
  ListOptions,
  PresignedUrlOptions,
} from "./s3-service";

/**
 * Factory function to create an S3 service instance for a specific bucket
 */
export function createS3Service(bucket: BucketName): S3Service {
  return new S3Service(bucket);
}

/**
 * Convenience function to create an S3 service for the AOE2 recordings bucket
 */
export function createAoe2RecsService(): S3Service {
  return new S3Service(BUCKETS.AOE2_RECS);
}
