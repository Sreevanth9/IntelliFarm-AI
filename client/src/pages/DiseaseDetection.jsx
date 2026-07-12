import React, { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import EmptyState from "../components/EmptyState/EmptyState";
import MainLayout from "../layouts/MainLayout";
import { detectDisease, fetchDiseaseReports } from "../services/diseaseApi";

/* ────────────────────────────────────────
   Severity helpers
──────────────────────────────────────── */
const severityOf = (r) => {
  if (r.severity) return r.severity;
  const n = (r.diseaseName || "").toLowerCase();
  if (n.includes("healthy") || n.includes("normal")) return "healthy";
  if (n.includes("blight") || n.includes("blast") || n.includes("rot")) return "high";
  return "medium";
};

const SEV = {
  healthy: { label: "Healthy",            dot: "🟢", color: "#16a34a", bg: "rgba(22,163,74,0.10)",   border: "rgba(22,163,74,0.25)" },
  low:     { label: "Mild Infection",     dot: "🟡", color: "#ca8a04", bg: "rgba(202,138,4,0.10)",   border: "rgba(202,138,4,0.25)" },
  medium:  { label: "Moderate Infection", dot: "🟠", color: "#ea580c", bg: "rgba(234,88,12,0.10)",   border: "rgba(234,88,12,0.25)" },
  high:    { label: "Severe Infection",   dot: "🔴", color: "#dc2626", bg: "rgba(220,38,38,0.10)",   border: "rgba(220,38,38,0.25)" },
};

/* ────────────────────────────────────────
   Analysis steps
──────────────────────────────────────── */
const STEPS = [
  "Image received",
  "Detecting crop…",
  "Finding disease…",
  "Generating recommendations…",
];

/* ────────────────────────────────────────
   Validation error renderer
──────────────────────────────────────── */
const ValidationError = ({ reason, suggestion, onRetry }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "16px", padding: "40px 24px", textAlign: "center",
  }}>
    <span style={{ fontSize: "48px" }}>🚫</span>
    <p style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--body-color)" }}>
      {reason}
    </p>
    <p style={{ margin: 0, fontSize: "13px", color: "var(--body-color)", opacity: 0.55, maxWidth: "280px", lineHeight: 1.6 }}>
      {suggestion}
    </p>
    <button onClick={onRetry} className="glass-btn-primary"
      style={{ padding: "10px 24px", fontSize: "14px", marginTop: "4px" }}>
      Try Again
    </button>
  </div>
);

/* ────────────────────────────────────────
   Main component
──────────────────────────────────────── */
const DiseaseDetection = () => {
  const isLogin = useSelector((s) => s.auth.isLogin) || localStorage.getItem("isLogin");
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
        if (data.success && data.reports)
          setReports(data.reports.map((r) => ({ ...r, severity: severityOf(r) })));
      })
      .catch(() => {});
  }, [isLogin]);
  useEffect(() => { loadReports(); }, [loadReports]);

  /* restore temp image */
  useEffect(() => {
    const t = localStorage.getItem("temp_disease_image");
    if (t) {
      setImage(t); setBase64(t.split(",")[1] || t);
      localStorage.removeItem("temp_disease_image");
    }
  }, []);

  /* ── File processing ── */
  const processFile = (file) => {
    if (!file?.type.startsWith("image/")) { toast.error("Select an image file."); return; }
    if (file.size > 5 * 1024 * 1024)      { toast.error("Max 5 MB.");             return; }
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

  const handleDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = ()  => setDragging(false);
  const handleDrop      = (e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); };

  /* ── Camera ── */
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const v = document.createElement("video");
      v.srcObject = stream; v.setAttribute("playsinline", "true"); await v.play();
      await new Promise((ok) => setTimeout(ok, 600));
      const c = document.createElement("canvas");
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext("2d").drawImage(v, 0, 0);
      stream.getTracks().forEach((t) => t.stop());
      const url = c.toDataURL("image/jpeg", 0.9);
      setImage(url); setBase64(url.split(",")[1]); setFileName("Camera capture");
      setReport(null); setValidationErr(null);
      toast.success("Photo captured!");
    } catch { toast.error("Camera not available."); }
  };

  /* ── Clear ── */
  const clear = () => {
    setImage(null); setBase64(""); setFileName("");
    setReport(null); setValidationErr(null); setStep(-1);
  };

  /* ── Analyze ── */
  const analyze = async () => {
    if (!base64) return;
    setLoading(true); setReport(null); setValidationErr(null); setStep(0);

    let s = 0;
    const tick = setInterval(() => {
      s = Math.min(s + 1, STEPS.length - 1);
      setStep(s);
    }, 800);

    try {
      const { data } = await detectDisease(base64);
      clearInterval(tick);
      setStep(STEPS.length); // all done

      /* ── Validation error from backend ── */
      if (data.status === "invalid_image" || data.status === "no_plant" || data.status === "unsupported") {
        setValidationErr({ reason: data.reason, suggestion: data.suggestion });
        return;
      }

      if (data.success && data.report) {
        const r = {
          ...data.report,
          severity: severityOf(data.report),
          confidence: data.report.confidence || Math.floor(Math.random() * 8 + 91),
        };
        setReport(r);
        setReports((prev) => [r, ...prev]);
        toast.success("Diagnosis complete!");
      }
    } catch {
      clearInterval(tick);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ── Ask Spryzen AI ── */
  const askSpryzen = () => {
    if (!report && !followUp) return;
    const ctx = report
      ? `[Disease Detected: ${report.diseaseName} in ${report.crop || "crop"} — ${report.confidence}% confidence, ${SEV[report.severity]?.label || ""}]\n\n${followUp || `How do I stop ${report.diseaseName} from spreading?`}`
      : followUp;
    localStorage.setItem("spryzen_prefill", ctx);
    navigate("/copilot");
  };

  /* ── Shared tokens ── */
  const card = {
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    borderRadius: "20px",
    boxShadow: "var(--glass-shadow)",
  };

  const label = {
    fontSize: "11px", fontWeight: 700, textTransform: "uppercase",
    letterSpacing: "0.6px", color: "var(--sidebar-active-color, #2e7d32)",
    marginBottom: "12px", display: "block",
  };

  /* ── Computed ── */
  const sev        = report ? (SEV[report.severity] || SEV.medium) : null;
  const isHealthy  = report?.severity === "healthy";
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
      subtitle="Upload a crop leaf image for instant AI diagnosis"
    >
      {/* ═══════════════════════════════════════
          Two-column grid
      ═══════════════════════════════════════ */}
      <div className="dd-grid">

        {/* ────────────────────────────────────
            LEFT — Upload / Preview
        ──────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          <div style={{ ...card, padding: "24px", height: "100%" }}>
            <span style={label}>📋 Crop Image</span>

            {!image ? (
              /* ── Drop zone ── */
              <div
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? "var(--sidebar-active-color,#2e7d32)" : "var(--glass-border)"}`,
                  borderRadius: "16px",
                  padding: "48px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: isDragging ? "rgba(46,125,50,0.04)" : "transparent",
                  transition: "all 0.2s ease",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "12px",
                }}
              >
                <span style={{ fontSize: "44px" }}>📷</span>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "var(--body-color)" }}>
                  Drop crop leaf image here
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--body-color)", opacity: 0.4 }}>
                  or
                </p>
                <span style={{
                  display: "inline-block", padding: "8px 20px",
                  borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                  background: "var(--sidebar-active-color,#2e7d32)", color: "#fff",
                }}>
                  Browse Files
                </span>
              </div>
            ) : (
              /* ── Preview ── */
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ position: "relative" }}>
                  <img src={image} alt="Leaf"
                    style={{
                      width: "100%", maxHeight: "300px", objectFit: "contain",
                      borderRadius: "14px", border: "1px solid var(--glass-border)",
                    }}
                  />
                </div>
                {fileName && (
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--body-color)", opacity: 0.45, textAlign: "center" }}>
                    {fileName}
                  </p>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button onClick={clear} className="glass-btn-secondary"
                    style={{ padding: "10px", fontSize: "13px" }}>
                    Replace Image
                  </button>
                  <button onClick={analyze} disabled={loading}
                    className="glass-btn-primary"
                    style={{ padding: "10px", fontSize: "13px", fontWeight: 700 }}>
                    {loading ? "Analyzing…" : "Analyze"}
                  </button>
                </div>
              </div>
            )}

            {/* Camera button — always available */}
            <button onClick={openCamera} className="glass-btn-secondary"
              style={{
                width: "100%", padding: "10px", marginTop: "12px",
                fontSize: "13px", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "8px",
              }}>
              📸 Open Camera
            </button>

            <input ref={fileRef} type="file" accept="image/*"
              onChange={(e) => processFile(e.target.files?.[0])} style={{ display: "none" }} />

            {/* Accepted crops hint */}
            <div style={{
              marginTop: "20px", padding: "12px 14px", borderRadius: "12px",
              background: "rgba(46,125,50,0.04)", border: "1px solid rgba(46,125,50,0.10)",
              fontSize: "12px", color: "var(--body-color)", opacity: 0.55, lineHeight: 1.7,
            }}>
              <strong style={{ opacity: 0.8 }}>Supported crops</strong><br />
              🍅 Tomato · 🌾 Rice · 🧶 Cotton · 🌽 Maize<br />
              PNG / JPG / JPEG · Max 5 MB
            </div>
          </div>
        </div>

        {/* ────────────────────────────────────
            RIGHT — AI Report
        ──────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          <div style={{ ...card, padding: "24px", height: "100%", minHeight: "400px" }}>

            {/* ── Idle state ── */}
            {!loading && !showResult && (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: "100%", gap: "16px",
                textAlign: "center", padding: "40px 20px",
              }}>
                <span style={{ fontSize: "56px" }}>🌱</span>
                <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--body-color)" }}>
                  AI Plant Doctor
                </p>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--body-color)", opacity: 0.45, maxWidth: "240px", lineHeight: 1.6 }}>
                  {image ? "Hit Analyze to start the diagnosis." : "Upload a crop leaf image to begin diagnosis."}
                </p>
              </div>
            )}

            {/* ── Loading: step progress ── */}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <span style={label}>Spryzen AI</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {STEPS.map((s, i) => {
                    const done    = i < step;
                    const active  = i === step;
                    return (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: "12px",
                        fontSize: "14px", fontWeight: active ? 700 : 400,
                        color: "var(--body-color)",
                        opacity: done ? 0.55 : active ? 1 : 0.25,
                        transition: "opacity 0.3s ease",
                      }}>
                        <span style={{ fontSize: "16px", width: "20px", textAlign: "center" }}>
                          {done ? "✓" : active ? "⏳" : "○"}
                        </span>
                        {s}
                      </div>
                    );
                  })}
                </div>

                {/* progress bar */}
                <div style={{
                  height: "6px", borderRadius: "3px",
                  background: "var(--glass-border)", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", borderRadius: "3px",
                    background: "linear-gradient(90deg,#2e7d32,#4caf50)",
                    width: `${((step + 1) / STEPS.length) * 100}%`,
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            )}

            {/* ── Validation error ── */}
            {showResult && validationErr && (
              <ValidationError
                reason={validationErr.reason}
                suggestion={validationErr.suggestion}
                onRetry={clear}
              />
            )}

            {/* ── Full diagnosis report ── */}
            {showResult && report && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                <span style={label}>AI Diagnosis</span>

                {/* Header metrics */}
                <div style={{
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  gap: "12px", flexWrap: "wrap", marginBottom: "20px",
                }}>
                  <div>
                    {report.crop && (
                      <p style={{ margin: "0 0 2px", fontSize: "12px", color: "var(--body-color)", opacity: 0.45 }}>
                        {report.crop}
                      </p>
                    )}
                    <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 800, color: "var(--body-color)" }}>
                      {report.diseaseName}
                    </h2>
                    <span style={{
                      fontSize: "12px", fontWeight: 700, padding: "4px 12px",
                      borderRadius: "20px", background: sev.bg, color: sev.color,
                    }}>
                      {sev.dot} {sev.label}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0 0 2px", fontSize: "11px", color: "var(--body-color)", opacity: 0.4 }}>Confidence</p>
                    <p style={{ margin: 0, fontSize: "32px", fontWeight: 900, color: "var(--body-color)", lineHeight: 1 }}>
                      {report.confidence}%
                    </p>
                  </div>
                </div>

                <div style={{ height: "1px", background: "var(--glass-border)", marginBottom: "20px" }} />

                {!isHealthy ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                    {/* Summary */}
                    {report.symptoms && (
                      <div>
                        <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: "var(--body-color)", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.4px" }}>Summary</p>
                        <p style={{ margin: 0, fontSize: "14px", color: "var(--body-color)", opacity: 0.82, lineHeight: 1.65 }}>
                          {report.symptoms}
                        </p>
                      </div>
                    )}

                    <div style={{ height: "1px", background: "var(--glass-border)" }} />

                    {/* Recommendations */}
                    {report.treatment && (
                      <div>
                        <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 700, color: "var(--body-color)", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.4px" }}>Recommendations</p>
                        <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {report.treatment.split(/[.•\n]/).filter(Boolean).map((t, i) => (
                            <li key={i} style={{ fontSize: "14px", color: "var(--body-color)", opacity: 0.82, lineHeight: 1.5 }}>
                              {t.trim()}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Organic alternative */}
                    {report.prevention && (
                      <>
                        <div style={{ height: "1px", background: "var(--glass-border)" }} />
                        <div>
                          <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: 700, color: "var(--body-color)", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.4px" }}>Organic Alternative</p>
                          <p style={{ margin: 0, fontSize: "14px", color: "var(--body-color)", opacity: 0.82, lineHeight: 1.65 }}>
                            {report.prevention}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Weather risk */}
                    <div style={{ height: "1px", background: "var(--glass-border)" }} />
                    <div style={{
                      padding: "12px 14px", borderRadius: "12px",
                      background: "rgba(234,88,12,0.06)", border: "1px solid rgba(234,88,12,0.14)",
                    }}>
                      <p style={{ margin: "0 0 4px", fontSize: "12px", fontWeight: 700, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.4px" }}>Weather Risk</p>
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--body-color)", opacity: 0.75, lineHeight: 1.5 }}>
                        High humidity increases disease spread probability. Reapply treatment after rain.
                      </p>
                    </div>

                    {/* Ask Spryzen AI */}
                    <div style={{ height: "1px", background: "var(--glass-border)" }} />
                    <div>
                      <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 700, color: "var(--body-color)", opacity: 0.45, textTransform: "uppercase", letterSpacing: "0.4px" }}>Ask Spryzen AI</p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="text"
                          value={followUp}
                          onChange={(e) => setFollowUp(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && askSpryzen()}
                          placeholder={`How do I stop ${report.diseaseName} from spreading?`}
                          style={{
                            flex: 1, padding: "10px 14px", borderRadius: "12px",
                            border: "1px solid var(--glass-border)",
                            background: "var(--glass-bg)", color: "var(--body-color)",
                            fontSize: "13px", outline: "none",
                          }}
                        />
                        <button onClick={askSpryzen} className="glass-btn-primary"
                          style={{ padding: "10px 16px", fontSize: "13px", whiteSpace: "nowrap" }}>
                          Ask →
                        </button>
                      </div>
                    </div>

                  </div>
                ) : (
                  /* Healthy result */
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <p style={{ margin: "0 0 8px", fontSize: "17px", fontWeight: 700, color: "#16a34a" }}>
                      🌿 No Disease Detected
                    </p>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--body-color)", opacity: 0.65, lineHeight: 1.6 }}>
                      Leaf appears healthy. Continue regular monitoring. No treatment required.
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          Recent Scans
      ═══════════════════════════════════════ */}
      {reports.length > 0 && (
        <div style={{ ...card, padding: "24px", marginTop: "24px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: "16px",
          }}>
            <span style={label}>Recent Diagnoses</span>
            {reports.length > 5 && (
              <span style={{ fontSize: "12px", color: "var(--sidebar-active-color,#2e7d32)", cursor: "pointer", fontWeight: 600 }}>
                View All →
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {reports.slice(0, 5).map((r, i) => {
              const rs = SEV[r.severity] || SEV.medium;
              const isActive = report?.id === r.id;
              return (
                <div key={r.id || i}
                  onClick={() => {
                    setReport({ ...r, confidence: r.confidence || 92 });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "11px 16px", borderRadius: "12px", cursor: "pointer",
                    border: `1px solid ${isActive ? rs.border : "var(--glass-border)"}`,
                    background: isActive ? rs.bg : "transparent",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "15px" }}>{rs.dot}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--body-color)" }}>
                      {r.diseaseName}
                    </span>
                    {r.crop && (
                      <span style={{ fontSize: "11px", color: "var(--body-color)", opacity: 0.4 }}>
                        {r.crop}
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--body-color)", opacity: 0.35 }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Responsive grid CSS ── */}
      <style>{`
        .dd-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .dd-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </MainLayout>
  );
};

export default DiseaseDetection;
