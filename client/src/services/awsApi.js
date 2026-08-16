import api from "./api";

/**
 * Fetch live AWS Cloud Infrastructure & Service Status
 */
export const fetchAwsStatus = () => api.get("/api/aws/status");

/**
 * Upload a file directly to Amazon S3 via Node.js API
 */
export const uploadToAwsS3 = (payload) => api.post("/api/aws/s3/upload", payload);

/**
 * Generate a pre-signed PUT URL for client-side direct upload to Amazon S3
 */
export const getS3PresignedUrl = (payload) => api.post("/api/aws/s3/presigned-url", payload);

/**
 * Delete a file from Amazon S3
 */
export const deleteFromAwsS3 = (key) => api.delete("/api/aws/s3/file", { data: { key } });
