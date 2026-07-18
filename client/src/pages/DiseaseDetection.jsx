import React, { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import EmptyState from "../components/EmptyState/EmptyState";
import MainLayout from "../layouts/MainLayout";
import { detectDisease, fetchDiseaseReports } from "../services/diseaseApi";

/* ────────────────────────────────────────
   Severity mappings
──────────────────────────────────────── */
const SEV = {
  healthy: { label: "Healthy",            dot: "🟢", color: "#16a34a", bg: "rgba(22,163,74,0.10)",   border: "rgba(22,163,74,0.25)" },
  low:     { label: "Mild Infection",     dot: "🟡", color: "#ca8a04", bg: "rgba(202,138,4,0.10)",   border: "rgba(202,138,4,0.25)" },
  medium:  { label: "Moderate Infection", dot: "🟠", color: "#ea580c", bg: "rgba(234,88,12,0.10)",   border: "rgba(234,88,12,0.25)" },
  high:    { label: "Severe Infection",   dot: "🔴", color: "#dc2626", bg: "rgba(220,38,38,0.10)",   border: "rgba(220,38,38,0.25)" },
};

const mapSeverity = (sevText) => {
  const s = (sevText || "").toLowerCase();
  if (s.includes("healthy")) return "healthy";
  if (s.includes("mild") || s.includes("low")) return "low";
  if (s.includes("severe") || s.includes("high")) return "high";
  return "medium";
};

/* ────────────────────────────────────────
   Analysis steps
──────────────────────────────────────── */
const STEPS = [
  "Upload Complete",
  "Validating image",
  "Identifying crop",
  "Detecting disease",
  "Consulting Spryzen AI"
];

/* ────────────────────────────────────────
   Main component
──────────────────────────────────────── */
const DiseaseDetection = () => {
  const isLogin = useSelector((s) => s.auth.isLogin);
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [image, setImage]         = useState(null);
  const [fileName, setFileName]   = useState("");
  const [base64, setBase64]       = useState("");
  const [isDragging, setDragging] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [step, setStep]           = useState(-1);
  const [report, setReport]       = useState(null);
  const [validationErr, setValidationErr] = useState(null);
  const [reports, setReports]     = useState([]);
  const [followUp, setFollowUp]   = useState("");

  /* load history */
  const loadReports = useCallback(() => {
    if (!isLogin) return;
    fetchDiseaseReports()
      .then(({ data }) => {
        if (data.success && data.reports) {
          setReports(data.reports);
        }
      })
      .catch(() => {});
  }, [isLogin]);
  
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  /* restore temp image */
  useEffect(() => {
    const t = localStorage.getItem("temp_disease_image");
    if (t) {
      setImage(t);
      setBase64(t.split(",")[1] || t);
      localStorage.removeItem("temp_disease_image");
    }
  }, []);

  /* ── File processing ── */
  const processFile = (file) => {
    if (!file?.type.startsWith("image/")) {
      toast.error("Select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max 5 MB.");
      return;
    }
    const r = new FileReader();
    r.onload = () => {
      setBase64(r.result.split(",")[1]);
      setImage(r.result);
      setFileName(file.name);
      setReport(null);
      setValidationErr(null);
    };
    r.readAsDataURL(file);
  };

  const handleDragOver  = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  
  const handleDragLeave = () => setDragging(false);
  
  const handleDrop      = (e) => {
    e.preventDefault();
    setDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  /* ── Camera ── */
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const v = document.createElement("video");
      v.srcObject = stream;
      v.setAttribute("playsinline", "true");
      await v.play();
      await new Promise((ok) => setTimeout(ok, 600));
      const c = document.createElement("canvas");
      c.width = v.videoWidth;
      c.height = v.videoHeight;
      c.getContext("2d").drawImage(v, 0, 0);
      stream.getTracks().forEach((t) => t.stop());
      const url = c.toDataURL("image/jpeg", 0.9);
      setImage(url);
      setBase64(url.split(",")[1]);
      setFileName("Camera capture.jpg");
      setReport(null);
      setValidationErr(null);
      toast.success("Photo captured!");
    } catch {
      toast.error("Camera not available.");
    }
  };

  /* ── Clear ── */
  const clear = () => {
    setImage(null);
    setBase64("");
    setFileName("");
    setReport(null);
    setValidationErr(null);
    setStep(-1);
  };

  /* ── Analyze ── */
  const analyze = async () => {
    if (!base64) return;
    setLoading(true);
    setReport(null);
    setValidationErr(null);
    setStep(0);

    let lat = null;
    let lon = null;

    try {
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3500 });
      });
      lat = pos.coords.latitude;
      lon = pos.coords.longitude;
      console.log("Acquired user location coordinates:", lat, lon);
    } catch (err) {
      console.warn("Could not acquire location coordinates:", err.message);
    }

    let s = 0;
    const tick = setInterval(() => {
      s = Math.min(s + 1, STEPS.length - 1);
      setStep(s);
    }, 700);

    try {
      const { data } = await detectDisease(base64, lat, lon);
      clearInterval(tick);
      setStep(STEPS.length); // all done

      /* ── Validation error from backend ── */
      if (data.status === "invalid") {
        setValidationErr({ reason: data.reason, suggestion: data.suggestion });
        return;
      }

      if (data.success && data.report) {
        setReport(data.report);
        setReports((prev) => [data.report, ...prev]);
        toast.success("Diagnosis complete!");
      }
    } catch (err) {
      clearInterval(tick);
      const msg = err.response?.data?.message || err.response?.data?.details || err.message || "Analysis failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── Ask Spryzen AI ── */
  const askSpryzen = () => {
    if (!report && !followUp) return;
    const ctx = report
      ? `[Disease Detected: ${report.diseaseName} in ${report.crop || "crop"} — ${report.confidence}% confidence, Severity: ${report.severity}]\n\n${followUp || `How do I stop ${report.diseaseName} from spreading?`}`
      : followUp;
    localStorage.setItem("spryzen_prefill", ctx);
    navigate("/copilot");
  };

  const showResult = (report || validationErr) && !loading;

  /* ── Auth guard ── */
  if (!isLogin) {
    return (
      <MainLayout title="Disease Detection">
        <EmptyState title="Login Required" message="Sign in to use AI disease detection." />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      eyebrow="AI Plant Doctor"
      title="Disease Detection"
      subtitle="Upload a crop leaf image for AI-powered diagnosis"
    >
      <div className="dd-grid">
        
        {/* LEFT COLUMN: Upload / Preview */}
        <div className="dd-col">
          <div className="dd-card dd-card-upload">
            {!image ? (
              // Drag and drop zone
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`dd-dropzone ${isDragging ? "active" : ""}`}
              >
                <div className="dd-dropzone-inner">
                  <span className="dd-icon-large">📷</span>
                  <p className="dd-dropzone-title">Drag image here</p>
                  <p className="dd-dropzone-or">or</p>
                  <button className="dd-btn-browse">Browse Files</button>
                  <div className="dd-divider-horizontal"></div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCamera();
                    }}
                    className="dd-btn-camera"
                  >
                    📸 Use Camera
                  </button>
                </div>
              </div>
            ) : (
              // Image preview
              <div className="dd-preview-container">
                <div className="dd-image-wrapper" style={{ position: "relative" }}>
                  <img src={image} alt="Leaf Preview" className="dd-preview-image" style={{ display: "block", width: "100%", height: "auto" }} />
                  {report && report.box && Array.isArray(report.box) && report.box.length === 4 && (
                    <div style={{
                      position: "absolute",
                      border: "3px dashed #ff4d4f",
                      borderRadius: "4px",
                      boxShadow: "0 0 10px rgba(255, 77, 79, 0.7)",
                      pointerEvents: "none",
                      left: `${report.box[1] / 10}%`,
                      top: `${report.box[0] / 10}%`,
                      width: `${(report.box[3] - report.box[1]) / 10}%`,
                      height: `${(report.box[2] - report.box[0]) / 10}%`
                    }}>
                      <span style={{
                        position: "absolute",
                        top: "-22px",
                        left: "-3px",
                        backgroundColor: "#ff4d4f",
                        color: "#fff",
                        fontSize: "10px",
                        padding: "2px 6px",
                        borderRadius: "2px",
                        fontWeight: "bold",
                        whiteSpace: "nowrap"
                      }}>
                        Infected Area
                      </span>
                    </div>
                  )}
                </div>
                {fileName && <p className="dd-filename">{fileName}</p>}
                
                {!loading && (
                  <div className="dd-preview-actions">
                    <button onClick={clear} className="dd-btn-replace">
                      Replace
                    </button>
                    <button onClick={analyze} className="dd-btn-analyze">
                      Analyze
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => processFile(e.target.files?.[0])}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: AI Plant Doctor */}
        <div className="dd-col">
          <div className="dd-card dd-card-report">
            {/* 1. Idle state */}
            {!loading && !showResult && (
              <div className="dd-idle-state">
                <span className="dd-icon-huge">🌱</span>
                <h3 className="dd-idle-title">AI Plant Doctor</h3>
                <p className="dd-idle-text">Waiting for image...</p>
              </div>
            )}

            {/* 2. Loading state */}
            {loading && (
              <div className="dd-loading-state">
                <h3 className="dd-loading-title">Spryzen AI</h3>
                <div className="dd-steps-list">
                  {STEPS.map((s, i) => {
                    const done = i < step;
                    const active = i === step;
                    return (
                      <div key={i} className={`dd-step-item ${done ? "done" : active ? "active" : ""}`}>
                        <span className="dd-step-icon">
                          {done ? "✓" : active ? "⏳" : "○"}
                        </span>
                        <span className="dd-step-text">{s}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Custom Progress bar */}
                <div className="dd-progress-track">
                  <div
                    className="dd-progress-bar"
                    style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* 3. Validation Error state */}
            {showResult && validationErr && (
              <div className="dd-validation-state">
                <span className="dd-icon-large-error">❌</span>
                <h3 className="dd-validation-title">{validationErr.reason}</h3>
                <p className="dd-validation-subtitle">This image cannot be analyzed.</p>
                <div className="dd-validation-checklist">
                  <p className="dd-checklist-header">Please upload:</p>
                  <p>✓ One leaf</p>
                  <p>✓ Good lighting</p>
                  <p>✓ Close-up image</p>
                </div>
                <button onClick={clear} className="dd-btn-retry">
                  Try Again
                </button>
              </div>
            )}

            {/* 4. Result Report state */}
            {showResult && report && (
              <div className="dd-report-content">
                {/* Header metrics */}
                <div className="dd-report-header">
                  <div className="dd-report-header-left">
                    <p className="dd-crop-tag">{report.crop || "Crop"}</p>
                    <h2 className="dd-disease-title">{report.diseaseName}</h2>
                    <span
                      className="dd-severity-badge"
                      style={{
                        backgroundColor: SEV[mapSeverity(report.severity)].bg,
                        color: SEV[mapSeverity(report.severity)].color,
                        border: `1px solid ${SEV[mapSeverity(report.severity)].border}`
                      }}
                    >
                      {SEV[mapSeverity(report.severity)].dot} {SEV[mapSeverity(report.severity)].label}
                    </span>
                  </div>
                  <div className="dd-report-header-right" style={{ textAlign: "right" }}>
                    <p className="dd-confidence-label">AI Confidence</p>
                    <p className="dd-confidence-value" style={{ margin: 0 }}>
                      {report.confidence >= 85 ? "High" : report.confidence >= 60 ? "Medium" : "Low"}
                    </p>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted, #6c757d)" }}>
                      ({report.confidence}% Estimate)
                    </span>
                  </div>
                </div>

                <div className="dd-divider"></div>

                {/* Report Body */}
                <div className="dd-report-body">
                  {/* Summary */}
                  {report.symptoms && (
                    <div className="dd-report-section">
                      <p className="dd-section-title">Summary</p>
                      <p className="dd-section-text">{report.symptoms}</p>
                    </div>
                  )}

                  {/* Treatment */}
                  {report.treatment && (
                    <>
                      <div className="dd-divider"></div>
                      <div className="dd-report-section">
                        <p className="dd-section-title">Treatment</p>
                        <div className="dd-treatment-methods">
                          {report.treatment.split("\n\n").map((chunk, idx) => {
                            const lines = chunk.split("\n");
                            const title = lines[0];
                            const items = lines.slice(1);
                            return (
                              <div key={idx} className="dd-treatment-chunk">
                                <p className="dd-treatment-subtitle">{title}</p>
                                <ul className="dd-treatment-list">
                                  {items.map((item, i) => (
                                    <li key={i} className="dd-treatment-item">
                                      {item.replace(/^[•-\s]*/, "").trim()}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Prevention */}
                  {report.prevention && (
                    <>
                      <div className="dd-divider"></div>
                      <div className="dd-report-section">
                        <p className="dd-section-title">Prevention</p>
                        <ul className="dd-prevention-list">
                          {report.prevention.split("\n").filter(Boolean).map((p, i) => (
                            <li key={i} className="dd-prevention-item">
                              {p.replace(/^[•-\s]*/, "").trim()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {/* Weather Risk */}
                  {report.weatherRisk && (
                    <>
                      <div className="dd-divider"></div>
                      <div className="dd-weather-risk-card">
                        <p className="dd-weather-risk-title">☀️ Weather Risk</p>
                        <p className="dd-weather-risk-text">{report.weatherRisk}</p>
                      </div>
                    </>
                  )}

                  {/* Expected Recovery */}
                  {report.expectedRecovery && (
                    <>
                      <div className="dd-divider"></div>
                      <div className="dd-recovery-card">
                        <p className="dd-recovery-title">🌿 Expected Recovery</p>
                        <p className="dd-recovery-text">{report.expectedRecovery}</p>
                      </div>
                    </>
                  )}

                  {/* AI Disclaimer */}
                  <div className="dd-divider"></div>
                  <div className="dd-disclaimer-card" style={{
                    backgroundColor: "var(--color-bg-light, #f8f9fa)",
                    border: "1px solid var(--color-border, #e9ecef)",
                    borderRadius: "8px",
                    padding: "12px 16px",
                    fontSize: "12px",
                    color: "var(--color-text-muted, #6c757d)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    marginTop: "16px"
                  }}>
                    <p style={{ fontWeight: "600", color: "var(--color-text, #212529)", margin: 0 }}>⚠️ AI-generated Estimate</p>
                    <p style={{ margin: 0 }}>
                      This diagnosis and confidence score are estimates based on visual AI analysis. For critical, high-value, or severe crop issues, consult a qualified agronomist or plant pathologist before making treatment decisions.
                    </p>
                  </div>

                  {/* Ask Spryzen AI */}
                  <div className="dd-divider"></div>
                  <div className="dd-ask-ai-section">
                    <p className="dd-ask-ai-title">Need more help?</p>
                    <div className="dd-ask-ai-input-wrapper">
                      <input
                        type="text"
                        value={followUp}
                        onChange={(e) => setFollowUp(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && askSpryzen()}
                        placeholder="Ask about this disease..."
                        className="dd-ask-ai-input"
                      />
                      <button onClick={askSpryzen} className="dd-ask-ai-send-btn">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────
          Recent Diagnoses Section
      ──────────────────────────────────────── */}
      {reports.length > 0 && (
        <div className="dd-card dd-recent-scans-card">
          <div className="dd-recent-header">
            <span className="dd-recent-title">Recent Diagnoses</span>
            {reports.length > 5 && (
              <span className="dd-recent-view-all">
                View All →
              </span>
            )}
          </div>

          <div className="dd-recent-list">
            {reports.slice(0, 5).map((r, i) => {
              const rs = SEV[mapSeverity(r.severity)] || SEV.medium;
              const isActive = report?.id === r.id;
              return (
                <div
                  key={r.id || i}
                  onClick={() => {
                    setReport(r);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={`dd-recent-item ${isActive ? "active" : ""}`}
                  style={{
                    borderColor: isActive ? rs.border : "var(--glass-border)",
                    backgroundColor: isActive ? rs.bg : "transparent"
                  }}
                >
                  <div className="dd-recent-item-left">
                    <span className="dd-recent-dot">{rs.dot}</span>
                    <span className="dd-recent-disease-name">{r.diseaseName}</span>
                    {r.crop && <span className="dd-recent-crop-tag">{r.crop}</span>}
                  </div>
                  <div className="dd-recent-item-right">
                    {r.confidence && <span className="dd-recent-conf">{r.confidence}%</span>}
                    <span className="dd-recent-date">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────
          Responsive & Premium Custom CSS
      ──────────────────────────────────────── */}
      <style>{`
        .dd-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: stretch;
          margin-bottom: 32px;
        }
        .dd-col {
          display: flex;
          flex-direction: column;
        }
        .dd-card {
          flex: 1;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.05);
          padding: 32px;
          display: flex;
          flex-direction: column;
        }
        .dd-card-upload {
          justify-content: center;
          align-items: stretch;
          min-height: 480px;
        }
        .dd-card-report {
          min-height: 480px;
        }
        
        /* Dropzone */
        .dd-dropzone {
          flex: 1;
          border: 2px dashed var(--glass-border);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }
        .dd-dropzone:hover, .dd-dropzone.active {
          border-color: var(--sidebar-active-color, #2e7d32);
          background: rgba(46,125,50,0.02);
        }
        .dd-dropzone-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 12px;
          max-width: 280px;
          width: 100%;
        }
        .dd-icon-large {
          font-size: 48px;
        }
        .dd-dropzone-title {
          margin: 0;
          font-weight: 700;
          fontSize: 16px;
          color: var(--body-color);
        }
        .dd-dropzone-or {
          margin: 0;
          font-size: 13px;
          color: var(--body-color);
          opacity: 0.4;
        }
        .dd-btn-browse {
          padding: 10px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          background: var(--sidebar-active-color, #2e7d32);
          color: #fff;
          border: none;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .dd-btn-browse:hover {
          transform: scale(1.02);
        }
        .dd-divider-horizontal {
          width: 100%;
          height: 1px;
          background: var(--glass-border);
          margin: 12px 0;
        }
        .dd-btn-camera {
          width: 100%;
          padding: 11px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--body-color);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s ease;
        }
        .dd-btn-camera:hover {
          background: var(--glass-border);
        }

        /* Image Preview */
        .dd-preview-container {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          gap: 20px;
        }
        .dd-image-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          overflow: hidden;
          background: rgba(0,0,0,0.02);
          border: 1px solid var(--glass-border);
          min-height: 250px;
        }
        .dd-preview-image {
          max-width: 100%;
          max-height: 320px;
          object-fit: contain;
        }
        .dd-filename {
          margin: 0;
          font-size: 12px;
          color: var(--body-color);
          opacity: 0.5;
          text-align: center;
          word-break: break-all;
        }
        .dd-preview-actions {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 12px;
        }
        .dd-btn-replace {
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--body-color);
          cursor: pointer;
        }
        .dd-btn-replace:hover {
          background: var(--glass-border);
        }
        .dd-btn-analyze {
          padding: 12px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          background: var(--sidebar-active-color, #2e7d32);
          color: #fff;
          border: none;
          cursor: pointer;
        }
        .dd-btn-analyze:hover {
          opacity: 0.95;
        }

        /* Idle State */
        .dd-idle-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 16px;
        }
        .dd-icon-huge {
          font-size: 56px;
        }
        .dd-idle-title {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: var(--body-color);
        }
        .dd-idle-text {
          margin: 0;
          font-size: 14px;
          color: var(--body-color);
          opacity: 0.45;
        }

        /* Loading State */
        .dd-loading-state {
          display: flex;
          flex-direction: column;
          gap: 24px;
          justify-content: center;
          height: 100%;
        }
        .dd-loading-title {
          margin: 0;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--sidebar-active-color, #2e7d32);
        }
        .dd-steps-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .dd-step-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: var(--body-color);
          opacity: 0.25;
          transition: all 0.3s ease;
        }
        .dd-step-item.active {
          opacity: 1;
          font-weight: 700;
        }
        .dd-step-item.done {
          opacity: 0.6;
        }
        .dd-step-icon {
          width: 20px;
          text-align: center;
        }
        .dd-progress-track {
          height: 6px;
          border-radius: 3px;
          background: var(--glass-border);
          overflow: hidden;
          margin-top: 8px;
        }
        .dd-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--sidebar-active-color, #2e7d32), #4caf50);
          transition: width 0.4s ease;
        }

        /* Validation State */
        .dd-validation-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 16px;
          padding: 20px 0;
        }
        .dd-icon-large-error {
          font-size: 48px;
        }
        .dd-validation-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: var(--body-color);
        }
        .dd-validation-subtitle {
          margin: 0;
          font-size: 14px;
          color: var(--body-color);
          opacity: 0.5;
        }
        .dd-validation-checklist {
          margin: 8px 0;
          padding: 14px 20px;
          border-radius: 12px;
          background: rgba(220,38,38,0.03);
          border: 1px solid rgba(220,38,38,0.08);
          font-size: 13px;
          color: var(--body-color);
          text-align: left;
          width: 100%;
          max-width: 240px;
        }
        .dd-checklist-header {
          margin: 0 0 8px;
          font-weight: 700;
          opacity: 0.7;
        }
        .dd-validation-checklist p:not(.dd-checklist-header) {
          margin: 4px 0;
          font-weight: 600;
          opacity: 0.85;
        }
        .dd-btn-retry {
          padding: 10px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 700;
          background: var(--sidebar-active-color, #2e7d32);
          color: #fff;
          border: none;
          cursor: pointer;
        }

        /* Report Content */
        .dd-report-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .dd-report-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .dd-crop-tag {
          margin: 0 0 4px;
          font-size: 12px;
          font-weight: 700;
          color: var(--sidebar-active-color, #2e7d32);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .dd-disease-title {
          margin: 0 0 10px;
          font-size: 24px;
          font-weight: 800;
          color: var(--body-color);
          line-height: 1.25;
        }
        .dd-severity-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
        }
        .dd-report-header-right {
          text-align: right;
        }
        .dd-confidence-label {
          margin: 0 0 2px;
          font-size: 11px;
          color: var(--body-color);
          opacity: 0.4;
        }
        .dd-confidence-value {
          margin: 0;
          font-size: 32px;
          font-weight: 900;
          color: var(--body-color);
          line-height: 1;
        }
        
        .dd-divider {
          height: 1px;
          background: var(--glass-border);
          width: 100%;
        }
        
        .dd-report-body {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .dd-report-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .dd-section-title {
          margin: 0;
          font-size: 12px;
          font-weight: 700;
          color: var(--body-color);
          opacity: 0.45;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .dd-section-text {
          margin: 0;
          font-size: 14px;
          color: var(--body-color);
          opacity: 0.82;
          line-height: 1.65;
        }

        /* Treatment section details */
        .dd-treatment-methods {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .dd-treatment-chunk {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .dd-treatment-subtitle {
          margin: 0;
          font-size: 13px;
          font-weight: 700;
          color: var(--body-color);
          opacity: 0.75;
        }
        .dd-treatment-list, .dd-prevention-list {
          margin: 0;
          padding-left: 18px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .dd-treatment-item, .dd-prevention-item {
          font-size: 13.5px;
          color: var(--body-color);
          opacity: 0.8;
          line-height: 1.5;
        }
        
        /* Info Cards */
        .dd-weather-risk-card {
          padding: 14px;
          border-radius: 12px;
          background: rgba(234,88,12,0.04);
          border: 1px solid rgba(234,88,12,0.12);
        }
        .dd-weather-risk-title {
          margin: 0 0 4px;
          font-size: 12px;
          font-weight: 700;
          color: #ea580c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .dd-weather-risk-text {
          margin: 0;
          font-size: 13px;
          color: var(--body-color);
          opacity: 0.78;
          line-height: 1.5;
        }
        
        .dd-recovery-card {
          padding: 14px;
          border-radius: 12px;
          background: rgba(46,125,50,0.04);
          border: 1px solid rgba(46,125,50,0.12);
        }
        .dd-recovery-title {
          margin: 0 0 4px;
          font-size: 12px;
          font-weight: 700;
          color: var(--sidebar-active-color, #2e7d32);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .dd-recovery-text {
          margin: 0;
          font-size: 13px;
          color: var(--body-color);
          opacity: 0.78;
          line-height: 1.5;
        }

        /* Ask AI */
        .dd-ask-ai-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .dd-ask-ai-title {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
          color: var(--body-color);
        }
        .dd-ask-ai-input-wrapper {
          display: flex;
          gap: 10px;
        }
        .dd-ask-ai-input {
          flex: 1;
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          background: var(--glass-bg);
          color: var(--body-color);
          font-size: 13.5px;
          outline: none;
        }
        .dd-ask-ai-send-btn {
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          background: var(--sidebar-active-color, #2e7d32);
          color: #fff;
          border: none;
          cursor: pointer;
        }

        /* Recent Diagnoses */
        .dd-recent-scans-card {
          margin-top: 8px;
          padding: 24px 32px;
        }
        .dd-recent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .dd-recent-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--sidebar-active-color, #2e7d32);
        }
        .dd-recent-view-all {
          font-size: 12px;
          color: var(--sidebar-active-color, #2e7d32);
          font-weight: 600;
          cursor: pointer;
        }
        .dd-recent-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .dd-recent-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 18px;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .dd-recent-item:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .dd-recent-item-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dd-recent-dot {
          font-size: 14px;
        }
        .dd-recent-disease-name {
          font-size: 13.5px;
          font-weight: 600;
          color: var(--body-color);
        }
        .dd-recent-crop-tag {
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
          background: rgba(0,0,0,0.04);
          color: var(--body-color);
          opacity: 0.6;
        }
        .dd-recent-item-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .dd-recent-conf {
          font-size: 12px;
          font-weight: 700;
          color: var(--body-color);
          opacity: 0.75;
        }
        .dd-recent-date {
          font-size: 11.5px;
          color: var(--body-color);
          opacity: 0.4;
        }

        /* Responsive Layout */
        @media (max-width: 900px) {
          .dd-grid {
            grid-template-columns: 1fr;
          }
          .dd-card-upload, .dd-card-report {
            min-height: auto;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default DiseaseDetection;
