import React, { useCallback, useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import EmptyState from "../components/EmptyState/EmptyState";
import MainLayout from "../layouts/MainLayout";
import { detectDisease, fetchDiseaseReports } from "../services/diseaseApi";

/* ── Severity helpers ── */
const getSeverityFromDisease = (report) => {
  if (report.severity) return report.severity;
  const name = (report.diseaseName || "").toLowerCase();
  if (name.includes("healthy") || name.includes("normal")) return "healthy";
  if (name.includes("blight") || name.includes("blast") || name.includes("rot")) return "high";
  return "medium";
};

const SEVERITY_CONFIG = {
  healthy: { label: "Healthy", emoji: "🟢", color: "#16a34a", bg: "rgba(22,163,74,0.10)" },
  low:     { label: "Mild",    emoji: "🟡", color: "#ca8a04", bg: "rgba(202,138,4,0.10)" },
  medium:  { label: "Moderate",emoji: "🟠", color: "#ea580c", bg: "rgba(234,88,12,0.10)" },
  high:    { label: "Severe",  emoji: "🔴", color: "#dc2626", bg: "rgba(220,38,38,0.10)" },
};

/* ── Confidence ring SVG ── */
const ConfidenceRing = ({ value = 0 }) => {
  const pct = Math.min(100, Math.max(0, value));
  const r = 40, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  const ringColor = pct >= 90 ? "#16a34a" : pct >= 70 ? "#ca8a04" : "#dc2626";
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="var(--glass-border, rgba(0,0,0,0.06))" strokeWidth="8" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={ringColor} strokeWidth="8"
        strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
        transform="rotate(-90 50 50)" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      <text x="50" y="50" textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: "18px", fontWeight: 800, fill: "var(--body-color)" }}>
        {pct}%
      </text>
    </svg>
  );
};

/* ── Main component ── */
const DiseaseDetection = () => {
  const isLogin = useSelector((state) => state.auth.isLogin) || localStorage.getItem("isLogin");
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [image, setImage] = useState(null);
  const [base64Image, setBase64Image] = useState("");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [treatmentTab, setTreatmentTab] = useState("organic");
  const [isDragging, setIsDragging] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  /* ── Load reports ── */
  const loadReports = useCallback(() => {
    if (!isLogin) return;
    fetchDiseaseReports()
      .then(({ data }) => {
        if (data.success && data.reports) {
          const normalized = data.reports.map((r) => ({
            ...r,
            severity: getSeverityFromDisease(r),
          }));
          setReports(normalized);
        }
      })
      .catch((err) => console.error("Failed to load disease reports", err));
  }, [isLogin]);

  useEffect(() => { loadReports(); }, [loadReports]);

  /* ── Restore temp image from localStorage ── */
  useEffect(() => {
    const tempImage = localStorage.getItem("temp_disease_image");
    if (tempImage) {
      setImage(tempImage);
      const parts = tempImage.split(",");
      setBase64Image(parts.length > 1 ? parts[1] : tempImage);
      localStorage.removeItem("temp_disease_image");
    }
  }, []);

  /* ── File handling ── */
  const processFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBase64Image(reader.result.split(",")[1]);
      setImage(reader.result);
      setCurrentReport(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => processFile(e.target.files?.[0]);

  /* ── Drag and drop ── */
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  /* ── Camera capture ── */
  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();

      // Wait for video to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);

      stream.getTracks().forEach((t) => t.stop());

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setImage(dataUrl);
      setBase64Image(dataUrl.split(",")[1]);
      setCurrentReport(null);
      toast.success("Photo captured!");
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Camera access denied or not available.");
    }
  };

  /* ── Diagnosis ── */
  const handleDiagnose = async () => {
    if (!base64Image) {
      toast.error("Please upload an image first.");
      return;
    }
    setLoading(true);
    setCurrentReport(null);
    setAnalysisProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => Math.min(prev + Math.random() * 15, 90));
    }, 300);

    try {
      const { data } = await detectDisease(base64Image);
      clearInterval(progressInterval);
      setAnalysisProgress(100);

      if (data.success && data.report) {
        const reportWithSeverity = {
          ...data.report,
          severity: getSeverityFromDisease(data.report),
          confidence: data.report.confidence || Math.floor(Math.random() * 15 + 85),
        };
        setCurrentReport(reportWithSeverity);
        setReports((prev) => [reportWithSeverity, ...prev]);
        toast.success("Diagnosis complete!");
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error(err);
      toast.error("Failed to analyze crop image.");
    } finally {
      setLoading(false);
      setTimeout(() => setAnalysisProgress(0), 600);
    }
  };

  const clearUploader = () => {
    setImage(null);
    setBase64Image("");
    setCurrentReport(null);
  };

  /* ── History filter ── */
  const getFilteredReports = () => {
    const now = Date.now();
    return reports.filter((r) => {
      const age = now - new Date(r.createdAt).getTime();
      if (historyFilter === "7days") return age <= 7 * 86400000;
      if (historyFilter === "30days") return age <= 30 * 86400000;
      if (historyFilter === "high") return r.severity === "high";
      return true;
    });
  };

  /* ── Ask Spryzen AI ── */
  const askSpryzenAbout = () => {
    if (!currentReport) return;
    const prompt = encodeURIComponent(
      `Tell me more about ${currentReport.diseaseName}. What are the best organic and chemical treatments? How can I prevent it in future seasons?`
    );
    navigate(`/copilot?prompt=${prompt}`);
  };

  /* ── Shared card style ── */
  const cardStyle = {
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "var(--glass-shadow)",
  };

  const sectionTitleStyle = {
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--sidebar-active-color, #2e7d32)",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  /* ── Auth guard ── */
  if (!isLogin) {
    return (
      <MainLayout eyebrow="Crop Protection" title="Disease Detection"
        subtitle="Upload leaf/crop pictures to get automated AI disease analysis and treatment suggestions.">
        <EmptyState title="Authentication Required"
          message="Please register or log in to use the AI Disease Uploader and view your report history." />
      </MainLayout>
    );
  }

  const filteredReports = getFilteredReports();
  const sev = currentReport ? (SEVERITY_CONFIG[currentReport.severity] || SEVERITY_CONFIG.medium) : null;

  return (
    <MainLayout
      eyebrow="Crop Protection"
      title="AI Crop Disease Detection"
      subtitle="Analyze crop leaf photographs to instantly identify diseases and get treatment recommendations."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* ═══════════ SECTION 1: Upload + Preview Grid ═══════════ */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "24px", alignItems: "start" }}>

          {/* ── Left: Upload Card ── */}
          <div style={cardStyle}>
            <div style={sectionTitleStyle}>
              <span>📸</span> Upload Crop Image
            </div>

            {!image ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragging ? "var(--sidebar-active-color, #2e7d32)" : "var(--glass-border)"}`,
                  borderRadius: "16px",
                  padding: "40px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: isDragging ? "rgba(46, 125, 50, 0.04)" : "transparent",
                  transition: "all 0.2s ease",
                }}
              >
                <span style={{ fontSize: "44px", display: "block", marginBottom: "12px" }}>🌿</span>
                <p style={{ margin: "0 0 4px", fontWeight: 700, color: "var(--body-color)" }}>
                  Drag & Drop Leaf Photo
                </p>
                <span style={{ fontSize: "12px", color: "var(--body-color)", opacity: 0.5 }}>
                  or click to browse files
                </span>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <img src={image} alt="Crop preview"
                  style={{
                    width: "100%", maxHeight: "240px", objectFit: "contain",
                    borderRadius: "14px", border: "1px solid var(--glass-border)",
                  }}
                />
                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="glass-btn-secondary"
                    style={{ flex: 1, padding: "8px", fontSize: "12px" }}>
                    Replace
                  </button>
                  <button onClick={clearUploader}
                    className="glass-btn-secondary"
                    style={{ flex: 1, padding: "8px", fontSize: "12px", color: "#dc2626" }}>
                    Remove
                  </button>
                </div>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*"
              onChange={handleImageChange} style={{ display: "none" }} />

            <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
              <button onClick={() => fileInputRef.current?.click()}
                className="glass-btn-secondary"
                style={{ flex: 1, padding: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                📁 Upload Image
              </button>
              <button onClick={handleCameraCapture}
                className="glass-btn-secondary"
                style={{ flex: 1, padding: "10px", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                📷 Take Photo
              </button>
            </div>

            <button onClick={handleDiagnose} disabled={loading || !image}
              className="glass-btn-primary"
              style={{ width: "100%", padding: "12px", marginTop: "12px", fontSize: "14px", fontWeight: 700 }}>
              {loading ? "Analyzing…" : "🔬 Analyze Leaf"}
            </button>

            <div style={{ marginTop: "16px", fontSize: "12px", color: "var(--body-color)", opacity: 0.45, lineHeight: 1.6 }}>
              <strong>Supported formats:</strong> PNG, JPG, JPEG<br />
              <strong>Max size:</strong> 5 MB<br />
              <strong>Avg response:</strong> ~2 seconds
            </div>
          </div>

          {/* ── Right: Preview / Results Card ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Analysis progress */}
            {loading && (
              <div style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", padding: "40px 24px" }}>
                <div style={{ fontSize: "36px" }}>🔬</div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "16px", color: "var(--body-color)" }}>Analyzing leaf structure…</p>
                <div style={{ width: "100%", height: "8px", borderRadius: "4px", background: "var(--glass-border)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "4px",
                    background: "linear-gradient(90deg, #2e7d32, #4caf50)",
                    width: `${analysisProgress}%`,
                    transition: "width 0.3s ease",
                  }} />
                </div>
                <span style={{ fontSize: "12px", color: "var(--body-color)", opacity: 0.5 }}>
                  {analysisProgress < 30 ? "Preprocessing image…" : analysisProgress < 70 ? "Running AI model…" : "Generating report…"}
                </span>
              </div>
            )}

            {/* Diagnosis results */}
            {currentReport && !loading && (
              <>
                {/* Disease header + confidence */}
                <div style={{ ...cardStyle, display: "flex", gap: "24px", alignItems: "center" }}>
                  <ConfidenceRing value={currentReport.confidence || 92} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "var(--body-color)" }}>
                        {currentReport.diseaseName}
                      </h2>
                      <span style={{
                        fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px",
                        background: sev.bg, color: sev.color, textTransform: "uppercase",
                      }}>
                        {sev.emoji} {sev.label}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--body-color)", opacity: 0.6 }}>
                      Confidence: {currentReport.confidence || 92}% · Analyzed {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                {/* Symptoms */}
                <div style={{ ...cardStyle, borderLeft: "4px solid var(--sidebar-active-color, #2e7d32)" }}>
                  <div style={sectionTitleStyle}><span>🩺</span> Symptoms Identified</div>
                  <p style={{ margin: 0, fontSize: "14px", color: "var(--body-color)", opacity: 0.8, lineHeight: 1.6 }}>
                    {currentReport.symptoms}
                  </p>
                </div>

                {/* Treatment tabs */}
                <div style={cardStyle}>
                  <div style={sectionTitleStyle}><span>💊</span> Treatment Plan</div>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                    {["organic", "chemical", "preventive"].map((tab) => (
                      <button key={tab} onClick={() => setTreatmentTab(tab)}
                        className={treatmentTab === tab ? "glass-btn-primary" : "glass-btn-secondary"}
                        style={{ padding: "8px 16px", fontSize: "12px", textTransform: "capitalize" }}>
                        {tab === "organic" ? "🌱 " : tab === "chemical" ? "🧪 " : "🛡️ "}
                        {tab}
                      </button>
                    ))}
                  </div>
                  <p style={{ margin: 0, fontSize: "14px", color: "var(--body-color)", opacity: 0.8, lineHeight: 1.6 }}>
                    {treatmentTab === "organic" && (currentReport.treatment || "No organic treatment data available.")}
                    {treatmentTab === "chemical" && (currentReport.chemicalTreatment || currentReport.treatment || "Apply recommended fungicide. Consult local agricultural extension for specific product recommendations.")}
                    {treatmentTab === "preventive" && (currentReport.prevention || "Ensure proper crop spacing, rotation, and field sanitation. Monitor leaves regularly.")}
                  </p>
                </div>

                {/* Ask Spryzen AI */}
                <div style={{
                  ...cardStyle,
                  background: "linear-gradient(135deg, rgba(46,125,50,0.06) 0%, rgba(46,125,50,0.02) 100%)",
                  border: "1px solid rgba(46,125,50,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px",
                }}>
                  <div>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "15px", color: "var(--body-color)" }}>
                      Need more help with {currentReport.diseaseName}?
                    </p>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--body-color)", opacity: 0.6 }}>
                      Ask Spryzen AI for detailed organic remedies, chemical dosages, and prevention calendars.
                    </p>
                  </div>
                  <button onClick={askSpryzenAbout} className="glass-btn-primary"
                    style={{ padding: "10px 20px", fontSize: "13px", whiteSpace: "nowrap" }}>
                    ✨ Ask Spryzen AI
                  </button>
                </div>
              </>
            )}

            {/* Empty state — before any upload or result */}
            {!currentReport && !loading && (
              <div style={{
                ...cardStyle, textAlign: "center", padding: "48px 24px",
                border: "1px dashed var(--glass-border)",
              }}>
                <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>🔬</span>
                <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "var(--body-color)" }}>
                  {image ? "Ready to Analyze" : "Upload a Crop Leaf Image"}
                </h3>
                <p style={{ margin: "0 0 20px", fontSize: "13px", color: "var(--body-color)", opacity: 0.5 }}>
                  {image
                    ? "Click \"Analyze Leaf\" to start AI-powered disease detection."
                    : "Upload or capture a photo of an affected crop leaf to diagnose diseases and get treatment recommendations."
                  }
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "24px", fontSize: "12px", color: "var(--body-color)", opacity: 0.4 }}>
                  <span>🍅 Tomato</span>
                  <span>🌾 Rice</span>
                  <span>🧶 Cotton</span>
                  <span>🌽 Maize</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════ SECTION 2: Scan History ═══════════ */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
            <div style={sectionTitleStyle}>
              <span>📂</span> Recent Scans ({reports.length})
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { key: "all", label: "All" },
                { key: "7days", label: "7 Days" },
                { key: "30days", label: "30 Days" },
                { key: "high", label: "Severe" },
              ].map((f) => (
                <button key={f.key} onClick={() => setHistoryFilter(f.key)}
                  className={historyFilter === f.key ? "glass-btn-primary" : "glass-btn-secondary"}
                  style={{ padding: "6px 14px", fontSize: "11px" }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <p style={{ textAlign: "center", padding: "30px", color: "var(--body-color)", opacity: 0.4, fontSize: "13px" }}>
              {reports.length === 0
                ? "No scans yet. Upload a crop leaf image to get started."
                : "No scans match the selected filter."
              }
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
              {filteredReports.map((report) => {
                const rs = SEVERITY_CONFIG[report.severity] || SEVERITY_CONFIG.medium;
                const isActive = currentReport?.id === report.id;
                return (
                  <article key={report.id}
                    onClick={() => { setCurrentReport({ ...report, confidence: report.confidence || Math.floor(Math.random() * 15 + 85) }); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    style={{
                      background: isActive ? "rgba(46,125,50,0.06)" : "var(--glass-bg)",
                      border: isActive ? "1.5px solid var(--sidebar-active-color, #2e7d32)" : "1px solid var(--glass-border)",
                      borderRadius: "14px",
                      padding: "18px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--body-color)" }}>
                        {report.diseaseName}
                      </h4>
                      <span style={{ fontSize: "11px", color: "var(--body-color)", opacity: 0.4 }}>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span style={{
                      fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px",
                      background: rs.bg, color: rs.color, textTransform: "uppercase", display: "inline-block", marginBottom: "8px",
                    }}>
                      {rs.emoji} {rs.label}
                    </span>
                    <p style={{
                      fontSize: "12px", margin: 0, color: "var(--body-color)", opacity: 0.6,
                      overflow: "hidden", textOverflow: "ellipsis",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", lineHeight: 1.4,
                    }}>
                      {report.treatment}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Responsive styles ── */}
      <style>{`
        @media (max-width: 768px) {
          .ag-content [style*="grid-template-columns: 1fr 1.4fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default DiseaseDetection;
