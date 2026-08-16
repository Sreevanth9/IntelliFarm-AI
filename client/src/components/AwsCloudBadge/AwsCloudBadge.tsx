import React, { useState, useEffect } from "react";
import {
  Cloud,
  UploadCloud,
  X,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchAwsStatus, uploadToAwsS3 } from "../../services/awsApi";
import "./AwsCloudBadge.css";

export const AwsCloudBadge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "tester" | "interview">("overview");
  const [awsInfo, setAwsInfo] = useState<any>(null);

  // S3 Tester state
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const { data } = await fetchAwsStatus();
      if (data?.success) {
        setAwsInfo(data.architecture);
      }
    } catch (err) {
      console.warn("Could not load AWS status:", err);
    }
  };

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
          folder: "interview-tests",
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
        title="View AWS Cloud Architecture & S3 Integration"
        aria-label="AWS Cloud Architecture"
      >
        <Cloud size={16} />
        <span>AWS Cloud</span>
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
                    AWS Cloud Architecture
                  </h3>
                  <span style={{ fontSize: "0.8125rem", color: "#64748b" }}>
                    React.js • Node.js Express • Amazon S3 • AWS App Runner & Amplify
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

            {/* Tabs */}
            <div className="aws-tabs">
              <button
                type="button"
                className={`aws-tab-btn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                Cloud Infrastructure
              </button>
              <button
                type="button"
                className={`aws-tab-btn ${activeTab === "tester" ? "active" : ""}`}
                onClick={() => setActiveTab("tester")}
              >
                Live S3 Upload Tester
              </button>
              <button
                type="button"
                className={`aws-tab-btn ${activeTab === "interview" ? "active" : ""}`}
                onClick={() => setActiveTab("interview")}
              >
                Interview Architecture Q&A
              </button>
            </div>

            {/* Body */}
            <div className="aws-modal-body">
              {activeTab === "overview" && (
                <>
                  {/* Service Cards Grid */}
                  <div className="aws-services-grid">
                    <div className="aws-service-card">
                      <span className="aws-service-card-title">Object Storage</span>
                      <span className="aws-service-card-name">Amazon S3</span>
                      <p className="aws-service-card-desc">
                        Stores plant disease leaf scans, farmer avatars, and generated reports with AWS SDK v3.
                      </p>
                      <span className="aws-service-status-pill">
                        <CheckCircle2 size={12} />
                        Bucket: {awsInfo?.infrastructure?.storage?.bucket || "intellifarm-storage"}
                      </span>
                    </div>

                    <div className="aws-service-card">
                      <span className="aws-service-card-title">Compute & API</span>
                      <span className="aws-service-card-name">AWS App Runner / ECS</span>
                      <p className="aws-service-card-desc">
                        Containerized Node.js & Express REST API with Docker, Helmet security, and SSE streaming.
                      </p>
                      <span className="aws-service-status-pill">
                        <CheckCircle2 size={12} /> Node.js 20+ Runtime
                      </span>
                    </div>

                    <div className="aws-service-card">
                      <span className="aws-service-card-title">Frontend Hosting</span>
                      <span className="aws-service-card-name">AWS Amplify / S3 CDN</span>
                      <p className="aws-service-card-desc">
                        React 18 Single Page Application deployed via amplify.yml with automated CI/CD.
                      </p>
                      <span className="aws-service-status-pill">
                        <CheckCircle2 size={12} /> Global Edge CDN
                      </span>
                    </div>

                    <div className="aws-service-card">
                      <span className="aws-service-card-title">Region & IAM</span>
                      <span className="aws-service-card-name">
                        {awsInfo?.region || "ap-south-1 (Mumbai)"}
                      </span>
                      <p className="aws-service-card-desc">
                        Secured with AWS IAM least-privilege policies and pre-signed upload URLs.
                      </p>
                      <span className="aws-service-status-pill">
                        <CheckCircle2 size={12} /> IAM Protected
                      </span>
                    </div>
                  </div>

                  {/* Architecture Flow Diagram */}
                  <div>
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9375rem" }}>
                      End-to-End Cloud Flow
                    </h4>
                    <div className="aws-architecture-diagram">
                      <div className="aws-arch-flow">
                        <div className="aws-arch-node">
                          <strong>React.js Client</strong>
                          <span>AWS Amplify / S3</span>
                        </div>
                        <span className="aws-arch-arrow">→</span>
                        <div className="aws-arch-node">
                          <strong>Node.js Express</strong>
                          <span>AWS App Runner / ECS</span>
                        </div>
                        <span className="aws-arch-arrow">→</span>
                        <div className="aws-arch-node">
                          <strong>Amazon S3</strong>
                          <span>Images & Reports</span>
                        </div>
                        <span className="aws-arch-arrow">+</span>
                        <div className="aws-arch-node">
                          <strong>PostgreSQL</strong>
                          <span>User & Farm Data</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "tester" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                    Test the live <strong>Amazon S3 upload pipeline</strong> powered by Node.js AWS SDK v3. Select an image to upload directly through the API.
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
              )}

              {activeTab === "interview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.875rem" }}>
                  <div style={{ background: "rgba(255, 153, 0, 0.08)", padding: "14px", borderRadius: "10px", borderLeft: "4px solid #ff9900" }}>
                    <strong style={{ color: "#d97706", display: "block", marginBottom: "4px" }}>
                      1. How does your project use React.js, Node.js, and AWS together?
                    </strong>
                    <p style={{ margin: 0, color: "#475569" }}>
                      The frontend is built in React 18 SPA. When a farmer uploads a leaf image for disease diagnosis, the React UI submits the photo to our Node.js backend. The Node.js service uses the AWS SDK v3 to store the image in an Amazon S3 bucket, generates an S3 object URL, passes the image to AI vision models for diagnosis, and persists the analysis metadata in PostgreSQL.
                    </p>
                  </div>

                  <div style={{ background: "rgba(255, 153, 0, 0.08)", padding: "14px", borderRadius: "10px", borderLeft: "4px solid #ff9900" }}>
                    <strong style={{ color: "#d97706", display: "block", marginBottom: "4px" }}>
                      2. Why did you use AWS S3 & Presigned URLs?
                    </strong>
                    <p style={{ margin: 0, color: "#475569" }}>
                      Amazon S3 provides durable, high-throughput cloud storage. Using S3 pre-signed URLs allows secure, direct client-to-S3 uploads without bottlenecking the Node.js API server for heavy media files.
                    </p>
                  </div>

                  <div style={{ background: "rgba(255, 153, 0, 0.08)", padding: "14px", borderRadius: "10px", borderLeft: "4px solid #ff9900" }}>
                    <strong style={{ color: "#d97706", display: "block", marginBottom: "4px" }}>
                      3. How is the application deployed on AWS?
                    </strong>
                    <p style={{ margin: 0, color: "#475569" }}>
                      The Node.js backend is containerized via Docker and deployed using AWS App Runner / ECS, while the React frontend is hosted on AWS Amplify / Amazon S3 backed by AWS CloudFront CDN for sub-50ms latency.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AwsCloudBadge;
