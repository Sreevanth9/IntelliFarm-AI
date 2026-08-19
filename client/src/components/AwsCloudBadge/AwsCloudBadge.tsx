import React, { useState } from "react";
import {
  Cloud,
  UploadCloud,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { uploadToAwsS3 } from "../../services/awsApi";
import "./AwsCloudBadge.css";

export const AwsCloudBadge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // S3 Tester state
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be smaller than 5MB");
      return;
    }

    setUploading(true);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const { data } = await uploadToAwsS3({
          base64,
          filename: file.name,
          mimeType: file.type || "image/jpeg",
          folder: "s3-tests",
        });

        setUploadResult(data);
        toast.success("AWS S3 Upload executed successfully!");
      } catch (err: any) {
        toast.error(err.response?.data?.message || "S3 Upload failed");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Navbar Trigger Badge */}
      <button
        type="button"
        className="aws-badge-btn"
        onClick={() => setIsOpen(true)}
        title="Live Amazon S3 Upload Tester"
        aria-label="AWS S3 Upload Tester"
      >
        <Cloud size={16} />
        <span>AWS S3 Tester</span>
        <span className="aws-status-dot" />
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="aws-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="aws-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="aws-modal-header">
              <div className="aws-header-title-wrap">
                <div className="aws-header-icon">
                  <Cloud size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700 }}>
                    AWS S3 Live Upload Tester
                  </h3>
                  <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                    Amazon S3 • Node.js AWS SDK v3 • Object Storage Pipeline
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="aws-modal-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="aws-modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                  Test the live <strong>Amazon S3 upload pipeline</strong> powered by Node.js AWS SDK v3. Select an image or document to upload directly through the API.
                </p>

                <label className="aws-tester-dropzone">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    style={{ display: "none" }}
                    onChange={handleTestUpload}
                    disabled={uploading}
                  />
                  <UploadCloud size={36} color="#ff9900" style={{ margin: "0 auto 8px" }} />
                  <strong style={{ display: "block", fontSize: "0.9375rem" }}>
                    {uploading ? "Uploading to Amazon S3..." : "Click or Drop a file to test S3 Upload"}
                  </strong>
                  <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                    Supports PNG, JPG, WebP, PDF (Max 5MB)
                  </span>
                </label>

                {uploadResult && (
                  <div>
                    <h5 style={{ margin: "0 0 8px 0", fontSize: "0.875rem" }}>
                      AWS S3 API Response:
                    </h5>
                    <pre className="aws-result-json">
                      {JSON.stringify(uploadResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AwsCloudBadge;
