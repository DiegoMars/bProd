import { S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 configuration using S3-compatible API
export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// Bucket names from environment
export const R2_BUCKET_ORIGINALS = process.env.R2_BUCKET_ORIGINALS!;
export const R2_BUCKET_VARIANTS = process.env.R2_BUCKET_VARIANTS!;

// Public URL for accessing variants
export const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL!;
