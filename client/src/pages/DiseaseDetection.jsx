import React, { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import {
  UploadCloud,
  Camera,
  Microscope,
  Leaf,
  CloudRain,
  ShieldCheck,
  Clock,
  Send,
  Loader2,
  Sparkles,
  Info,
  AlertTriangle,
  AlertCircle
} from "lucide-react";

import EmptyState from "../components/EmptyState/EmptyState";
import MainLayout from "../layouts/MainLayout";
import { detectDisease, fetchDiseaseReports } from "../services/diseaseApi";

/* ────────────────────────────────────────
   Severity mappings
──────────────────────────────────────── */
const SEV = {
  healthy: { label: "Healthy",            color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)" },
  low:     { label: "Mild Infection",     color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  medium:  { label: "Moderate Infection", color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.2)" },
  high:    { label: "Severe Infection",   color: "#ef4444", bg: "rgba(239,68,68,0.08)",  border: "rgba(239,68,68,0.2)" },
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
  "Validating image quality",
  "Identifying crop type",
  "Detecting disease markers",
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

  // Farm deep-link context
  const routerLoc = useLocation();
  const urlP = new URLSearchParams(routerLoc.search);
  const [_linkedFarmId]  = useState(urlP.get("farmId") || ""); // eslint-disable-line
  const [linkedFarmName] = useState(urlP.get("farmName") || "");
  const [linkedCrop]     = useState(urlP.get("crop") || "");

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

  /* ── Helper: parse lists ── */
  const parseList = (text) => {
    if (!text) return [];
    return text.split("\n").map(x => x.replace(/^[•-\s\d.]*/, "").trim()).filter(Boolean);
  };

  const parseTreatmentList = (treatmentText, type) => {
    if (!treatmentText) return [];
    const parts = treatmentText.split("\n\n");
    let target = "";
    if (type === "organic") {
      target = parts.find(p => p.toLowerCase().includes("organic")) || parts[0] || "";
    } else {
      target = parts.find(p => p.toLowerCase().includes("chemical")) || parts[1] || "";
    }
    const lines = target.split("\n").filter(Boolean);
    const items = lines.length > 1 && (lines[0].toLowerCase().includes("organic") || lines[0].toLowerCase().includes("chemical") || lines[0].endsWith(":")) ? lines.slice(1) : lines;
    return items.map(x => x.replace(/^[•-\s\d.]*/, "").trim()).filter(Boolean);
  };

  /* ── Auth guard ── */
  if (!isLogin) {
    return (
      <MainLayout title="">
        <EmptyState title="Login Required" message="Sign in to use AI disease detection." />
      </MainLayout>
    );
  }

  return (
    <MainLayout eyebrow="" title="" subtitle="">
      <div className="dd-page-wrapper">
        
        {/* CENTERED HEADER */}
        <div className="dd-header-centered">
          <h1 className="dd-page-title">Disease Detection</h1>
          <p className="dd-page-subtitle">Upload a crop leaf for real-time AI diagnosis &amp; pathology analysis</p>
          {linkedFarmName && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "10px", padding: "6px 16px", borderRadius: "99px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", fontSize: "13px", fontWeight: 700, color: "#8b5cf6" }}>
              <Microscope size={13} />
              Scanning for: {linkedFarmName}{linkedCrop ? ` · ${linkedCrop}` : ""}
            </div>
          )}
        </div>

        {/* TWO-COLUMN GRID */}
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
                    <UploadCloud className="dd-dropzone-icon" size={48} />
                    <p className="dd-dropzone-title">Drag & Drop</p>
                    <p className="dd-dropzone-or">or click to browse</p>
                    <div className="dd-dropzone-info">
                      <span>JPG • PNG • WEBP</span>
                      <span>Max 5 MB</span>
                    </div>
                    <button className="dd-btn-browse" type="button">
                      Browse Image
                    </button>
                  </div>
                </div>
              ) : (
                // Image preview with detected region highlight
                <div className="dd-preview-container">
                  <div className="dd-preview-title-banner">
                    {showResult ? "Detected Region" : "Original Image"}
                  </div>
                  <div className="dd-image-wrapper" style={{ position: "relative" }}>
                    <img src={image} alt="Leaf Preview" className="dd-preview-image" style={{ display: "block", width: "100%", height: "auto" }} />
                    
                    {/* Bounding Box Highlights */}
                    {report && report.box && Array.isArray(report.box) && report.box.length === 4 && (
                      <div className="dd-highlight-box" style={{
                        left: `${report.box[1] / 10}%`,
                        top: `${report.box[0] / 10}%`,
                        width: `${(report.box[3] - report.box[1]) / 10}%`,
                        height: `${(report.box[2] - report.box[0]) / 10}%`
                      }}>
                        <span className="dd-highlight-tag">
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
                        Analyze Leaf
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

              {!image && (
                <div className="dd-upload-footer">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCamera();
                    }}
                    className="dd-btn-camera"
                    type="button"
                  >
                    <Camera size={16} /> Use Camera
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Spryzen AI conversational card */}
          <div className="dd-col">
            <div className="dd-card dd-card-report">
              
              {/* 1. Idle state */}
              {!loading && !showResult && (
                <div className="dd-idle-state">
                  <div className="dd-chat-avatar">
                    <Microscope size={22} />
                  </div>
                  <h3 className="dd-idle-title">Spryzen AI Pathology</h3>
                  <p className="dd-idle-text">Upload a crop leaf image on the left and click "Analyze Leaf" to begin AI diagnosis.</p>
                </div>
              )}

              {/* 2. Loading state */}
              {loading && (
                <div className="dd-loading-state">
                  <div className="dd-loading-spinner-wrapper">
                    <Loader2 className="dd-spinner-icon animate-spin" size={44} />
                    <h3 className="dd-loading-title-main">Analyzing Leaf...</h3>
                    <p className="dd-loading-subtitle">Qwen2.5-VL and Spryzen AI are running plant pathology assessments.</p>
                  </div>
                  
                  <div className="dd-steps-list">
                    {STEPS.map((s, i) => {
                      const done = i < step;
                      const active = i === step;
                      return (
                        <div key={i} className={`dd-step-item ${done ? "done" : active ? "active" : ""}`}>
                          <span className="dd-step-icon">
                            {done ? <ShieldCheck size={16} className="icon-success" /> : active ? <Loader2 size={16} className="animate-spin icon-pending" /> : <div className="dd-dot" />}
                          </span>
                          <span className="dd-step-text">{s}</span>
                        </div>
                      );
                    })}
                  </div>
                  
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
                  <AlertCircle size={48} className="dd-error-icon" />
                  <h3 className="dd-validation-title">{validationErr.reason}</h3>
                  <p className="dd-validation-subtitle">This image cannot be analyzed by the plant doctor.</p>
                  
                  <div className="dd-validation-checklist">
                    <p className="dd-checklist-header">Image Requirements:</p>
                    <p>✓ Must contain a single crop leaf</p>
                    <p>✓ High lighting and high clarity</p>
                    <p>✓ lesion spots clearly visible</p>
                  </div>
                  
                  <button onClick={clear} className="dd-btn-retry">
                    Try Again
                  </button>
                </div>
              )}

              {/* 4. Result Report state (ChatGPT style conversational look) */}
              {showResult && report && (
                <div className="dd-report-content">
                  
                  {/* Conversational Header */}
                  <div className="dd-chat-header">
                    <div className="dd-chat-avatar">
                      <Sparkles size={20} />
                    </div>
                    <div className="dd-chat-title-wrapper">
                      <p className="dd-chat-name">Spryzen AI</p>
                      <p className="dd-chat-status">Diagnosis Complete</p>
                    </div>
                  </div>

                  {/* Bubble intro */}
                  <div className="dd-chat-bubble-ai">
                    I analyzed the uploaded leaf image. Here are the crop disease identification details and treatment protocols.
                    
                    {/* Metrics Grid */}
                    <div className="dd-metrics-grid">
                      <div className="dd-metric-card">
                        <span className="dd-metric-label">Crop</span>
                        <span className="dd-metric-value">{report.crop || "Unknown"}</span>
                      </div>
                      <div className="dd-metric-card">
                        <span className="dd-metric-label">Disease</span>
                        <span className="dd-metric-value">{report.diseaseName}</span>
                      </div>
                      <div className="dd-metric-card">
                        <span className="dd-metric-label">AI Confidence</span>
                        <span className="dd-metric-value">{report.confidence >= 85 ? "High" : report.confidence >= 60 ? "Medium" : "Low"}</span>
                      </div>
                      <div className="dd-metric-card">
                        <span className="dd-metric-label">Severity</span>
                        <span className="dd-metric-value" style={{ color: SEV[mapSeverity(report.severity)].color }}>
                          {SEV[mapSeverity(report.severity)].label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {report.symptoms && (
                    <div className="dd-report-section">
                      <p className="dd-section-title"><Info size={14} style={{ marginRight: 6 }} /> Summary & Symptoms</p>
                      <p className="dd-section-text">{report.symptoms}</p>
                    </div>
                  )}

                  {/* Side-by-side Recommendations Columns */}
                  <div className="dd-treatment-grid">
                    
                    {/* Organic Cards */}
                    <div className="dd-treatment-card organic">
                      <div className="dd-card-header-with-icon">
                        <ShieldCheck size={16} className="icon-organic" />
                        <span className="dd-card-title">Organic</span>
                      </div>
                      <ul className="dd-treatment-list">
                        {parseTreatmentList(report.treatment, "organic").map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                        {parseTreatmentList(report.treatment, "organic").length === 0 && <li>None specified.</li>}
                      </ul>
                    </div>

                    {/* Chemical Cards */}
                    <div className="dd-treatment-card chemical">
                      <div className="dd-card-header-with-icon">
                        <Leaf size={16} className="icon-chemical" />
                        <span className="dd-card-title">Chemical</span>
                      </div>
                      <ul className="dd-treatment-list">
                        {parseTreatmentList(report.treatment, "chemical").map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                        {parseTreatmentList(report.treatment, "chemical").length === 0 && <li>None specified.</li>}
                      </ul>
                    </div>

                    {/* Prevention Cards */}
                    <div className="dd-treatment-card prevention">
                      <div className="dd-card-header-with-icon">
                        <Microscope size={16} className="icon-prevention" />
                        <span className="dd-card-title">Prevention</span>
                      </div>
                      <ul className="dd-prevention-list">
                        {parseList(report.prevention).map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                        {parseList(report.prevention).length === 0 && <li>None specified.</li>}
                      </ul>
                    </div>

                  </div>

                  {/* Secondary Grid (Weather + Recovery) */}
                  <div className="dd-secondary-grid">
                    {report.weatherRisk && (
                      <div className="dd-weather-risk-card-modern">
                        <p className="dd-weather-risk-title-modern"><CloudRain size={16} /> Weather Risk Warning</p>
                        <p className="dd-weather-risk-text-modern">{report.weatherRisk}</p>
                      </div>
                    )}
                    
                    {report.expectedRecovery && (
                      <div className="dd-recovery-card-modern">
                        <p className="dd-recovery-title-modern"><Clock size={16} /> Expected Recovery</p>
                        <p className="dd-recovery-text-modern">{report.expectedRecovery}</p>
                      </div>
                    )}
                  </div>

                  {/* AI Disclaimer */}
                  <div className="dd-disclaimer-card" style={{
                    backgroundColor: "rgba(0,0,0,0.02)",
                    border: "1px solid var(--dd-border)",
                    borderRadius: "14px",
                    padding: "14px 18px",
                    fontSize: "12px",
                    color: "var(--dd-text-muted)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}>
                    <p style={{ fontWeight: "700", color: "var(--dd-text)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
                      <AlertTriangle size={14} className="icon-warning" style={{ color: "#ca8a04" }} /> AI-Generated Diagnostic Estimate
                    </p>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>
                      This report and confidence scores are estimates generated by AI models. For high-value crops or severe infections, consult a professional agronomist or plant pathologist before committing to treatment.
                    </p>
                  </div>

                  {/* Statistics Block */}
                  <div className="dd-stats-row">
                    <div className="dd-stat-item">
                      <span className="dd-stat-label">Model</span>
                      <span className="dd-stat-val">Qwen2.5-VL</span>
                    </div>
                    <div className="dd-stat-item">
                      <span className="dd-stat-label">Response Time</span>
                      <span className="dd-stat-val">~2.4s</span>
                    </div>
                    <div className="dd-stat-item">
                      <span className="dd-stat-label">Engine</span>
                      <span className="dd-stat-val">Spryzen AI</span>
                    </div>
                    <div className="dd-stat-item">
                      <span className="dd-stat-label">Confidence</span>
                      <span className="dd-stat-val">{report.confidence}%</span>
                    </div>
                  </div>

                  {/* Conversational input: Ask Spryzen AI */}
                  <div className="dd-ask-ai-section">
                    <p className="dd-ask-ai-title">Consult Spryzen AI Copilot</p>
                    <div className="dd-ask-ai-input-wrapper">
                      <input
                        type="text"
                        value={followUp}
                        onChange={(e) => setFollowUp(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && askSpryzen()}
                        placeholder="Ask how to stop this infection, or get customized care tips..."
                        className="dd-ask-ai-input"
                      />
                      <button onClick={askSpryzen} className="dd-ask-ai-send-btn" type="button">
                        <Send size={16} />
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: Recent Diagnoses */}
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
                      borderColor: isActive ? rs.color : "var(--dd-border)",
                      backgroundColor: isActive ? rs.bg : "transparent"
                    }}
                  >
                    <div className="dd-recent-item-left">
                      <span className="dd-recent-status-dot" style={{ backgroundColor: rs.color }} />
                      <span className="dd-recent-disease-name">{r.diseaseName}</span>
                      {r.crop && <span className="dd-recent-crop-tag">{r.crop}</span>}
                    </div>
                    <div className="dd-recent-item-right">
                      {r.confidence && <span className="dd-recent-conf">{r.confidence}% AI Confidence</span>}
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

      </div>

      {/* Responsive & Premium Custom CSS */}
      <style>{`
        .dd-page-wrapper {
          --dd-bg: var(--copilot-bg, #f9fbf7);
          --dd-card-bg: var(--copilot-assistant-bubble, #ffffff);
          --dd-border: var(--copilot-border, rgba(46, 125, 50, 0.18));
          --dd-primary: var(--copilot-primary, #2e7d32);
          --dd-primary-light: var(--copilot-primary-light, rgba(46, 125, 50, 0.08));
          --dd-text: var(--copilot-text, #2c3e35);
          --dd-text-muted: var(--copilot-text-muted, #6b7c72);
          --dd-font: var(--copilot-font, 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif);
          --dd-shadow: var(--copilot-shadow, 0 12px 40px rgba(46, 125, 50, 0.06));
          --dd-shadow-hover: var(--copilot-shadow-hover, 0 16px 48px rgba(46, 125, 50, 0.12));
          
          font-family: var(--dd-font);
          color: var(--dd-text);
          max-width: 1400px;
          margin: 0 auto;
          padding: 16px 24px 48px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          box-sizing: border-box;
        }

        .dd-header-centered {
          text-align: center;
          margin-bottom: 8px;
        }
        .dd-page-title {
          font-size: 32px;
          font-weight: 800;
          color: var(--dd-text);
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }
        .dd-page-subtitle {
          font-size: 16px;
          color: var(--dd-text-muted);
          margin: 0;
        }

        .dd-grid {
          display: grid;
          grid-template-columns: 1.15fr 1.35fr;
          gap: 32px;
          align-items: start;
        }

        .dd-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .dd-card {
          background: var(--dd-card-bg);
          border: 1px solid var(--dd-border);
          border-radius: 24px;
          box-shadow: var(--dd-shadow);
          padding: 32px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dd-card-upload {
          min-height: 520px;
        }
        .dd-card-report {
          min-height: 520px;
        }

        /* Dropzone */
        .dd-dropzone {
          flex: 1;
          border: 2px dashed var(--dd-border);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 56px 24px;
          background: rgba(255, 255, 255, 0.02);
        }
        .dd-dropzone:hover, .dd-dropzone.active {
          border-color: var(--dd-primary);
          background: var(--dd-primary-light);
          transform: translateY(-2px);
        }
        .dd-dropzone-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 16px;
          max-width: 320px;
          width: 100%;
        }
        .dd-dropzone-icon {
          color: var(--dd-primary);
          opacity: 0.8;
          transition: transform 0.2s ease;
        }
        .dd-dropzone:hover .dd-dropzone-icon {
          transform: scale(1.08);
        }
        .dd-dropzone-title {
          margin: 0;
          font-weight: 700;
          font-size: 18px;
          color: var(--dd-text);
        }
        .dd-dropzone-or {
          margin: 0;
          font-size: 14px;
          color: var(--dd-text-muted);
        }
        .dd-dropzone-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
          color: var(--dd-text-muted);
          opacity: 0.8;
        }
        .dd-btn-browse {
          padding: 12px 28px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          background: var(--dd-primary);
          color: #fff;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(46, 125, 50, 0.25);
          transition: all 0.2s ease;
        }
        .dd-btn-browse:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(46, 125, 50, 0.35);
        }
        .dd-upload-footer {
          margin-top: 16px;
          width: 100%;
        }
        .dd-btn-camera {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          background: transparent;
          border: 1px solid var(--dd-border);
          color: var(--dd-text);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .dd-btn-camera:hover {
          background: var(--dd-primary-light);
          border-color: var(--dd-primary);
          color: var(--dd-primary);
        }

        /* Image Preview styling */
        .dd-preview-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 16px;
        }
        .dd-preview-title-banner {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--dd-text-muted);
        }
        .dd-image-wrapper {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          overflow: hidden;
          background: rgba(0,0,0,0.02);
          border: 1px solid var(--dd-border);
          min-height: 300px;
        }
        .dd-preview-image {
          max-width: 100%;
          max-height: 360px;
          object-fit: contain;
        }
        .dd-filename {
          margin: 0;
          font-size: 12px;
          color: var(--dd-text-muted);
          text-align: center;
          word-break: break-all;
        }
        .dd-preview-actions {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 16px;
        }
        .dd-btn-replace {
          padding: 14px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          background: transparent;
          border: 1px solid var(--dd-border);
          color: var(--dd-text);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dd-btn-replace:hover {
          background: rgba(0,0,0,0.03);
        }
        .dd-btn-analyze {
          padding: 14px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          background: var(--dd-primary);
          color: #fff;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(46, 125, 50, 0.25);
          transition: all 0.2s ease;
        }
        .dd-btn-analyze:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(46, 125, 50, 0.35);
        }

        /* Highlight box overlay */
        .dd-highlight-box {
          position: absolute;
          border: 3px dashed #ef4444;
          background-color: rgba(239, 68, 68, 0.15);
          border-radius: 8px;
          box-shadow: 0 0 16px rgba(239, 68, 68, 0.6);
          pointer-events: none;
        }
        .dd-highlight-tag {
          position: absolute;
          top: -24px;
          left: -3px;
          background-color: #ef4444;
          color: #fff;
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }

        /* Idle State */
        .dd-idle-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 20px;
          padding: 40px 20px;
        }
        .dd-idle-title {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: var(--dd-text);
          letter-spacing: -0.3px;
        }
        .dd-idle-text {
          margin: 0;
          font-size: 14.5px;
          color: var(--dd-text-muted);
          line-height: 1.6;
          max-width: 380px;
        }

        /* Loading State */
        .dd-loading-state {
          display: flex;
          flex-direction: column;
          gap: 28px;
          justify-content: center;
          height: 100%;
        }
        .dd-loading-spinner-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .dd-spinner-icon {
          color: var(--dd-primary);
        }
        .dd-loading-title-main {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: var(--dd-text);
        }
        .dd-loading-subtitle {
          margin: 0;
          font-size: 14px;
          color: var(--dd-text-muted);
          text-align: center;
          max-width: 320px;
        }
        .dd-steps-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .dd-step-item {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 14.5px;
          color: var(--dd-text);
          opacity: 0.35;
          padding: 8px 16px;
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        .dd-step-item.active {
          opacity: 1;
          font-weight: 700;
          background: var(--dd-primary-light);
          color: var(--dd-primary);
        }
        .dd-step-item.done {
          opacity: 0.65;
        }
        .icon-success {
          color: #10b981;
        }
        .icon-pending {
          color: #f59e0b;
        }
        .dd-progress-track {
          height: 6px;
          border-radius: 3px;
          background: rgba(0,0,0,0.05);
          overflow: hidden;
        }
        .dd-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--dd-primary), #10b981);
          transition: width 0.4s ease;
        }

        /* Error state */
        .dd-validation-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 20px;
          padding: 30px 10px;
        }
        .dd-error-icon {
          color: #ef4444;
        }
        .dd-validation-title {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: var(--dd-text);
        }
        .dd-validation-subtitle {
          margin: 0;
          font-size: 14.5px;
          color: var(--dd-text-muted);
        }
        .dd-validation-checklist {
          padding: 16px 20px;
          border-radius: 16px;
          background: rgba(239, 68, 68, 0.03);
          border: 1px solid rgba(239, 68, 68, 0.08);
          font-size: 13.5px;
          color: var(--dd-text);
          text-align: left;
          width: 100%;
          max-width: 280px;
          box-sizing: border-box;
        }
        .dd-checklist-header {
          margin: 0 0 8px;
          font-weight: 700;
          opacity: 0.7;
        }
        .dd-validation-checklist p:not(.dd-checklist-header) {
          margin: 6px 0;
          font-weight: 600;
          opacity: 0.85;
        }
        .dd-btn-retry {
          padding: 12px 28px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          background: var(--dd-primary);
          color: #fff;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dd-btn-retry:hover {
          transform: translateY(-1px);
        }

        /* Report Content details */
        .dd-report-content {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .dd-chat-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .dd-chat-avatar {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, var(--dd-primary), #10b981);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
        }
        .dd-chat-title-wrapper {
          display: flex;
          flex-direction: column;
        }
        .dd-chat-name {
          font-weight: 800;
          font-size: 18px;
          margin: 0;
          letter-spacing: -0.3px;
          color: var(--dd-text);
        }
        .dd-chat-status {
          font-size: 12px;
          color: var(--dd-primary);
          font-weight: 600;
          margin: 0;
        }

        .dd-chat-bubble-ai {
          background: var(--dd-primary-light);
          border-left: 4px solid var(--dd-primary);
          border-radius: 0 18px 18px 18px;
          padding: 20px;
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--dd-text);
        }

        /* Metrics grid */
        .dd-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 18px;
        }
        .dd-metric-card {
          background: var(--dd-card-bg);
          border: 1px solid var(--dd-border);
          border-radius: 14px;
          padding: 12px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 4px;
          box-shadow: var(--dd-shadow);
        }
        .dd-metric-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--dd-text-muted);
        }
        .dd-metric-value {
          font-weight: 800;
          font-size: 13.5px;
          color: var(--dd-text);
        }

        .dd-report-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .dd-section-title {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          color: var(--dd-text);
          display: flex;
          align-items: center;
        }
        .dd-section-text {
          margin: 0;
          font-size: 14px;
          color: var(--dd-text);
          opacity: 0.9;
          line-height: 1.65;
        }

        /* Side by side recommendations */
        .dd-treatment-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .dd-treatment-card {
          background: var(--dd-card-bg);
          border: 1px solid var(--dd-border);
          border-radius: 18px;
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: var(--dd-shadow);
          box-sizing: border-box;
        }
        .dd-treatment-card.organic {
          border-top: 4px solid #10b981;
        }
        .dd-treatment-card.chemical {
          border-top: 4px solid #0284c7;
        }
        .dd-treatment-card.prevention {
          border-top: 4px solid #f59e0b;
        }
        .dd-card-header-with-icon {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dd-card-title {
          font-weight: 800;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--dd-text);
        }
        .icon-organic {
          color: #10b981;
        }
        .icon-chemical {
          color: #0284c7;
        }
        .icon-prevention {
          color: #f59e0b;
        }
        .dd-treatment-list, .dd-prevention-list {
          margin: 0;
          padding-left: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .dd-treatment-list li, .dd-prevention-list li {
          font-size: 12.5px;
          line-height: 1.5;
          color: var(--dd-text);
          opacity: 0.9;
        }

        /* Secondary Modern Cards */
        .dd-secondary-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .dd-weather-risk-card-modern, .dd-recovery-card-modern {
          padding: 18px;
          border-radius: 18px;
          background: var(--dd-card-bg);
          border: 1px solid var(--dd-border);
          box-shadow: var(--dd-shadow);
          box-sizing: border-box;
        }
        .dd-weather-risk-card-modern {
          border-left: 4px solid #f97316;
        }
        .dd-recovery-card-modern {
          border-left: 4px solid #10b981;
        }
        .dd-weather-risk-title-modern, .dd-recovery-title-modern {
          margin: 0 0 8px;
          font-weight: 800;
          font-size: 13.5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dd-weather-risk-title-modern {
          color: #f97316;
        }
        .dd-recovery-title-modern {
          color: #10b981;
        }
        .dd-weather-risk-text-modern, .dd-recovery-text-modern {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: var(--dd-text);
          opacity: 0.9;
        }

        /* Stats Row */
        .dd-stats-row {
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding: 16px;
          border-radius: 16px;
          background: var(--dd-primary-light);
          border: 1px solid var(--dd-border);
        }
        .dd-stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .dd-stat-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--dd-text-muted);
          font-weight: 700;
        }
        .dd-stat-val {
          font-size: 13px;
          font-weight: 800;
          color: var(--dd-text);
        }

        /* Consult Spryzen Input */
        .dd-ask-ai-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 8px;
        }
        .dd-ask-ai-title {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
          color: var(--dd-text);
        }
        .dd-ask-ai-input-wrapper {
          display: flex;
          gap: 12px;
        }
        .dd-ask-ai-input {
          flex: 1;
          padding: 12px 18px;
          border-radius: 14px;
          border: 1px solid var(--dd-border);
          background: var(--dd-card-bg);
          color: var(--dd-text);
          font-size: 13.5px;
          outline: none;
          transition: all 0.2s ease;
          box-shadow: var(--dd-shadow);
        }
        .dd-ask-ai-input:focus {
          border-color: var(--dd-primary);
          box-shadow: 0 0 0 3px var(--dd-primary-light);
        }
        .dd-ask-ai-send-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: var(--dd-primary);
          color: #fff;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
        }
        .dd-ask-ai-send-btn:hover {
          background: #246427;
          transform: scale(1.04);
        }

        .dd-divider {
          height: 1px;
          background: var(--dd-border);
          width: 100%;
        }

        /* Recent Diagnoses Bottom Card */
        .dd-recent-scans-card {
          padding: 24px 32px;
        }
        .dd-recent-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .dd-recent-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--dd-primary);
        }
        .dd-recent-view-all {
          font-size: 12px;
          color: var(--dd-primary);
          font-weight: 700;
          cursor: pointer;
        }
        .dd-recent-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .dd-recent-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-radius: 16px;
          border: 1px solid var(--dd-border);
          cursor: pointer;
          transition: all 0.2s ease;
          background: var(--dd-card-bg);
          box-shadow: var(--dd-shadow);
        }
        .dd-recent-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--dd-shadow-hover);
        }
        .dd-recent-item-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .dd-recent-status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(0,0,0,0.1);
        }
        .dd-recent-disease-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--dd-text);
        }
        .dd-recent-crop-tag {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 8px;
          background: var(--dd-primary-light);
          color: var(--dd-primary);
        }
        .dd-recent-item-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .dd-recent-conf {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--dd-text-muted);
        }
        .dd-recent-date {
          font-size: 12px;
          color: var(--dd-text-muted);
          opacity: 0.6;
        }

        /* Comprehensive Responsive Layouts for Mobile and Tablet */
        @media (max-width: 1024px) {
          .dd-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          .dd-card-upload, .dd-card-report {
            min-height: auto;
          }
        }
        @media (max-width: 768px) {
          .dd-page-wrapper {
            padding: 8px 4px 32px;
            gap: 20px;
          }
          .dd-card {
            padding: 16px;
            border-radius: 18px;
          }
          .dd-dropzone {
            padding: 24px 12px;
          }
          .dd-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .dd-metric-card {
            padding: 12px 10px;
          }
          .dd-treatment-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .dd-secondary-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .dd-page-title {
            font-size: 24px;
          }
          .dd-page-subtitle {
            font-size: 14px;
          }
        }
        @media (max-width: 640px) {
          .dd-recent-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .dd-recent-item-right {
            width: 100%;
            justify-content: space-between;
          }
          .dd-btn-analyze, .dd-btn-camera, .dd-btn-retry {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default DiseaseDetection;
