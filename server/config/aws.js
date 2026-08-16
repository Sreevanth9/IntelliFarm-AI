import { S3Client } from "@aws-sdk/client-s3";
import "dotenv/config";

export const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "ap-south-1";
export const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || process.env.S3_BUCKET_NAME || "intellifarm-storage";

// Determine if AWS credentials are provided explicitly or using AWS environment
const hasExplicitCredentials = Boolean(
  process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
);

export const isAwsConfigured = Boolean(
  hasExplicitCredentials || process.env.AWS_EXECUTION_ENV || process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI
);

// Initialize AWS S3 Client
export const s3Client = new S3Client({
  region: AWS_REGION,
  ...(hasExplicitCredentials
    ? {
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

export const getAwsConfigSummary = () => ({
  configured: isAwsConfigured,
  region: AWS_REGION,
  bucket: S3_BUCKET_NAME,
  services: {
    s3: {
      status: isAwsConfigured ? "connected" : "ready_for_credentials",
      bucket: S3_BUCKET_NAME,
      region: AWS_REGION,
    },
    appRunner: {
      status: "supported",
      description: "Containerized Node.js API ready for AWS App Runner / ECS",
    },
    cloudFront: {
      status: "supported",
      description: "Optimized for global CDN distribution via AWS CloudFront",
    },
    amplify: {
      status: "supported",
      description: "Frontend CI/CD deployment configured via amplify.yml",
    },
  },
});
