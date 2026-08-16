import express from "express";
import {
  uploadFile,
  getPresignedUrl,
  getDownloadUrl,
  deleteFile,
  getAwsStatus,
} from "../controllers/awsController.js";
import { optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// AWS Cloud Infrastructure and Service Status
router.get("/status", getAwsStatus);

// Direct file upload to Amazon S3
router.post("/s3/upload", optionalAuth, uploadFile);

// Generate pre-signed URL for direct browser-to-S3 upload
router.post("/s3/presigned-url", optionalAuth, getPresignedUrl);

// Generate pre-signed download URL for private files
router.get("/s3/download-url", optionalAuth, getDownloadUrl);

// Delete file from S3
router.delete("/s3/file", optionalAuth, deleteFile);

export default router;
