import { Client } from "minio";

// Minio client configuration
const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT!,
  port: process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : undefined,
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!,
};

// Create and export the Minio client instance
export const minioClient = new Client(minioConfig);

// Bucket names configuration
export const BUCKETS = {
  AOE2_RECS: process.env.MINIO_BUCKET_NAME ?? "aoe-recs",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];
