import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState/EmptyState";
import MainLayout from "../layouts/MainLayout";
import { detectDisease, fetchDiseaseReports } from "../services/diseaseApi";

const DiseaseDetection = () => {
  const isLogin = useSelector((state) => state.auth.isLogin) || localStorage.getItem("isLogin");
  
  const [activeTab, setActiveTab] = useState("analyze");
  const [image, setImage] = useState(null);
  const [base64Image, setBase64Image] = useState("");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [historyFilter, setHistoryFilter] = useState("all");

  const loadReports = useCallback(() => {
    if (!isLogin) return;
    fetchDiseaseReports()
      .then(({ data }) => {
        if (data.success && data.reports) {
          const normalized = data.reports.map((r) => ({
            ...r,
            severity: r.severity || (r.diseaseName?.toLowerCase().includes("blight") || r.diseaseName?.toLowerCase().includes("blast") ? "high" : "medium")
          }));
          setReports(normalized);
        }
      })
      .catch((err) => {
        console.error("Failed to load disease reports", err);
      });
  }, [isLogin]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    const tempImage = localStorage.getItem("temp_disease_image");
    if (tempImage) {
      setImage(tempImage);
      const parts = tempImage.split(",");
      if (parts.length > 1) {
        setBase64Image(parts[1]);
      } else {
        setBase64Image(tempImage);
      }
      localStorage.removeItem("temp_disease_image");
    }
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      setBase64Image(result.split(",")[1]);
      setImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please drop an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      setBase64Image(result.split(",")[1]);
      setImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDiagnose = async (e) => {
    e.preventDefault();
    if (!base64Image) {
      toast.error("Please select or drop an image first.");
      return;
    }

    setLoading(true);
    setCurrentReport(null);
    try {
      const { data } = await detectDisease(base64Image);
      if (data.success && data.report) {
        const reportWithSeverity = {
          ...data.report,
          severity: data.report.severity || (data.report.diseaseName?.toLowerCase().includes("blight") || data.report.diseaseName?.toLowerCase().includes("blast") ? "high" : "medium")
        };
        setCurrentReport(reportWithSeverity);
        setReports((prev) => [reportWithSeverity, ...prev]);
        toast.success("Disease diagnosis complete!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to analyze crop image.");
    } finally {
      setLoading(false);
    }
  };

  const clearUploader = () => {
    setImage(null);
    setBase64Image("");
    setCurrentReport(null);
  };

  const getFilteredReports = () => {
    const now = Date.now();
    return reports.filter((r) => {
      const reportDate = new Date(r.createdAt).getTime();
      if (historyFilter === "7days") {
        return now - reportDate <= 7 * 24 * 60 * 60 * 1000;
      }
      if (historyFilter === "30days") {
        return now - reportDate <= 30 * 24 * 60 * 60 * 1000;
      }
      if (historyFilter === "high") {
        return r.severity === "high";
      }
      return true;
    });
  };

  const filteredReports = getFilteredReports();

  if (!isLogin) {
    return (
      <MainLayout
        eyebrow="Crop Protection"
        title="Disease Detection"
        subtitle="Upload leaf/crop pictures to get automated AI disease analysis and treatment suggestions."
      >
        <EmptyState
          title="Authentication Required"
          message="Please register or log in to use the AI Disease Uploader and view your report history."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      eyebrow="Crop Protection"
      title="AI Crop Disease Detection"
      subtitle="Analyze leaf/crop pictures to instantly identify diseases and get organic/chemical treatment plans."
    >
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>
        <button
          className={`glass-btn-${activeTab === "analyze" ? "primary" : "secondary"}`}
          style={{ padding: "10px 24px" }}
          onClick={() => setActiveTab("analyze")}
        >
          🔍 Diagnose Crop
        </button>
        <button
          className={`glass-btn-${activeTab === "history" ? "primary" : "secondary"}`}
          style={{ padding: "10px 24px" }}
          onClick={() => setActiveTab("history")}
        >
          📂 Scan History ({reports.length})
        </button>
      </div>

      {activeTab === "analyze" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "24px", alignItems: "start" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <section className="liquid-glass-panel">
              <h2 style={{ fontSize: "18px", marginBottom: "16px", color: "#fff" }}>Upload Crop Leaf Image</h2>
              
              <form onSubmit={handleDiagnose} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {!image ? (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    style={{
                      border: "2px dashed rgba(82, 183, 136, 0.3)",
                      borderRadius: "12px",
                      padding: "48px 16px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: "rgba(82, 183, 136, 0.03)",
                      transition: "all 0.2s ease",
                    }}
                    onClick={() => {
                      const input = document.getElementById("file-input");
                      if (input) input.click();
                    }}
                  >
                    <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>📸</span>
                    <p style={{ margin: "0 0 4px 0", color: "#52b788", fontWeight: "700" }}>
                      Drag & Drop Crop Leaf Photo Here
                    </p>
                    <span style={{ fontSize: "12px", opacity: 0.6 }}>
                      Supports PNG, JPG, or JPEG up to 5MB
                    </span>
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: "none" }}
                    />
                  </div>
                ) : (
                  <div style={{ position: "relative", width: "100%" }}>
                    <img
                      src={image}
                      alt="Preview"
                      style={{
                        width: "100%",
                        maxHeight: "280px",
                        objectFit: "contain",
                        borderRadius: "12px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={clearUploader}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "30px",
                        height: "30px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !image}
                  className="glass-btn-primary"
                  style={{ width: "100%", padding: "12px" }}
                >
                  {loading ? "Analyzing Leaf..." : "Detect Disease"}
                </button>
              </form>
            </section>

            {loading && <Loader label="Evaluating crop symptoms using Vision models..." />}
          </div>

          <div>
            {currentReport ? (
              <section className="liquid-glass-panel" style={{ borderLeft: "4px solid #52b788" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12px", opacity: 0.5, textTransform: "uppercase" }}>Analysis Result</span>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "4px 8px",
                    borderRadius: "6px",
                    background: currentReport.severity === "high" ? "rgba(211, 47, 47, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: currentReport.severity === "high" ? "#f87171" : "#fbbf24",
                    textTransform: "uppercase"
                  }}>
                    {currentReport.severity} Severity
                  </span>
                </div>
                <h2 style={{ color: "#fff", margin: "0 0 16px 0", fontSize: "20px", fontWeight: 700 }}>
                  {currentReport.diseaseName}
                </h2>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div className="liquid-glass-card" style={{ padding: "14px 18px", borderLeft: "3px solid #52b788" }}>
                    <strong style={{ color: "#fff", display: "block", fontSize: "13px", marginBottom: "4px" }}>Symptoms Identified</strong>
                    <p style={{ margin: 0, fontSize: "13px", opacity: 0.8, lineHeight: "1.4" }}>{currentReport.symptoms}</p>
                  </div>
                  
                  <div className="liquid-glass-card" style={{ padding: "14px 18px", borderLeft: "3px solid #52b788" }}>
                    <strong style={{ color: "#fff", display: "block", fontSize: "13px", marginBottom: "4px" }}>Recommended Treatment</strong>
                    <p style={{ margin: 0, fontSize: "13px", opacity: 0.8, lineHeight: "1.4" }}>{currentReport.treatment}</p>
                  </div>

                  <div className="liquid-glass-card" style={{ padding: "14px 18px", borderLeft: "3px solid #52b788" }}>
                    <strong style={{ color: "#fff", display: "block", fontSize: "13px", marginBottom: "4px" }}>Preventive Measures</strong>
                    <p style={{ margin: 0, fontSize: "13px", opacity: 0.8, lineHeight: "1.4" }}>{currentReport.prevention}</p>
                  </div>
                </div>
              </section>
            ) : (
              <div style={{ padding: "48px 16px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "12px", opacity: 0.6 }}>
                <h4>No Scan Active</h4>
                <p style={{ fontSize: "13px", marginTop: "6px" }}>Upload a picture of an affected crop leaf to diagnose root causes and remedies.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          <div className="liquid-glass-panel" style={{ padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: "bold" }}>Filter History:</span>
            <div style={{ display: "flex", gap: "8px" }}>
              {["all", "7days", "30days", "high"].map((filter) => (
                <button
                  key={filter}
                  className={`glass-btn-${historyFilter === filter ? "primary" : "secondary"}`}
                  style={{ padding: "6px 12px", fontSize: "12px" }}
                  onClick={() => setHistoryFilter(filter)}
                >
                  {filter === "all" && "All Scans"}
                  {filter === "7days" && "Last 7 Days"}
                  {filter === "30days" && "Last 30 Days"}
                  {filter === "high" && "High Severity"}
                </button>
              ))}
            </div>
          </div>

          <div className="liquid-glass-panel">
            {filteredReports.length === 0 ? (
              <p style={{ textAlign: "center", opacity: 0.5, padding: "30px" }}>No scanning history matches these filters.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {filteredReports.map((report) => (
                  <article
                    key={report.id}
                    className="liquid-glass-card"
                    onClick={() => {
                      setCurrentReport(report);
                      setActiveTab("analyze");
                    }}
                    style={{
                      cursor: "pointer",
                      padding: "20px",
                      border: currentReport?.id === report.id ? "1.5px solid #52b788" : "1px solid rgba(255,255,255,0.08)",
                      background: currentReport?.id === report.id ? "rgba(82, 183, 136, 0.08)" : "var(--glass-bg)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <h3 style={{ margin: "0 0 6px 0", fontSize: "15px", color: "#fff", fontWeight: 700 }}>{report.diseaseName}</h3>
                      <span style={{ fontSize: "11px", opacity: 0.5 }}>
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: report.severity === "high" ? "rgba(211, 47, 47, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      color: report.severity === "high" ? "#f87171" : "#fbbf24",
                      textTransform: "uppercase",
                      display: "inline-block",
                      marginBottom: "10px"
                    }}>
                      {report.severity} Severity
                    </span>
                    <p style={{ fontSize: "12px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", opacity: 0.8, lineHeight: "1.4" }}>
                      <strong>Treatment:</strong> {report.treatment}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </MainLayout>
  );
};

export default DiseaseDetection;
