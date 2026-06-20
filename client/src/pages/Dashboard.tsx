import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import crops from "../data/crops.json";
import { fetchWeatherBundle } from "../services/weatherApi";
import { fetchFarms } from "../services/farmApi";
import { fetchAlerts } from "../services/alertsApi";
import { fetchDiseaseReports } from "../services/diseaseApi";
import { useAuth } from "../context/AuthContext";
import { Farm, Alert } from "../types";
import farmLogo from "../assets/intellifarm-icon.png";

const Dashboard: React.FC = () => {
  const { farmer } = useAuth() as any;
  const [weatherData, setWeatherData] = useState<any>(null);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [realAlerts, setRealAlerts] = useState<Alert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [reportsCount, setReportsCount] = useState(0);

  const localLocation = localStorage.getItem("location");
  const defaultCity = localLocation ? localLocation.split(",")[0].trim() : "Hyderabad";

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    fetchWeatherBundle({ city: defaultCity })
      .then((response) => {
        setWeatherData(response.data.data);
      })
      .catch((err) => {
        console.error("Dashboard weather fetch failed", err);
      });

    // Fetch farms
    fetchFarms()
      .then(({ data }) => {
        if (data.success && data.farms) {
          setFarms(data.farms);
        }
      })
      .catch((err) => {
        console.error("Dashboard farms fetch failed", err);
      });

    // Fetch alerts
    setLoadingAlerts(true);
    fetchAlerts()
      .then(({ data }) => {
        if (data.success && data.alerts) {
          setRealAlerts(data.alerts);
        }
      })
      .catch((err) => {
        console.error("Dashboard alerts fetch failed", err);
      })
      .finally(() => {
        setLoadingAlerts(false);
      });

    // Fetch disease reports count
    fetchDiseaseReports()
      .then(({ data }) => {
        if (data.success && data.reports) {
          setReportsCount(data.reports.length);
        }
      })
      .catch((err) => {
        console.error("Dashboard disease reports fetch failed", err);
      });
  }, [defaultCity]);

  const recommendedCrop = crops[0];

  return (
    <MainLayout
      eyebrow="Overview"
      title="Dashboard"
      subtitle="Real-time analytics and farm telemetry"
      actions={<Link className="glass-btn-primary" style={{ padding: "10px 20px", textDecoration: "none", fontSize: "13px" }} to="/assistant">Ask AI Assistant</Link>}
    >
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Background Glass Orbs */}
        <div style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "#52b788",
          filter: "blur(180px)",
          opacity: 0.1,
          top: "10%",
          left: "5%",
          pointerEvents: "none",
          zIndex: 0
        }}></div>
        <div style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "#2e7d32",
          filter: "blur(180px)",
          opacity: 0.06,
          bottom: "10%",
          right: "5%",
          pointerEvents: "none",
          zIndex: 0
        }}></div>

        {/* 1. Hero Glass Section */}
        <section className="liquid-glass-panel" style={{
          display: "flex",
          gap: "24px",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "28px",
          background: "linear-gradient(135deg, rgba(82, 183, 136, 0.12) 0%, rgba(15, 118, 110, 0.04) 100%)",
          border: "1px solid rgba(82, 183, 136, 0.2)",
          position: "relative",
          zIndex: 1,
          padding: "32px 40px",
          minHeight: "260px",
          boxSizing: "border-box"
        }}>
          <div style={{ flex: 1 }}>
            <p className="ag-eyebrow" style={{ color: "#52b788", fontWeight: 800, fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
              {getGreeting()}, {farmer?.name || "Sreevanth"} 👋
            </p>
            <h2 style={{ fontSize: "32px", color: "#ffffff", fontWeight: 800, margin: "0 0 8px 0" }}>
              Welcome to IntelliFarm AI
            </h2>
            <p style={{ fontSize: "16px", color: "rgba(255, 255, 255, 0.7)", margin: "0 0 28px 0" }}>
              Smart Farming Assistance for Modern Agriculture
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <Link className="glass-action-pill" to="/weather">☁️ Check Weather</Link>
              <Link className="glass-action-pill" to="/crop-advisor">🌱 Crop Suggestions</Link>
              <Link className="glass-action-pill" to="/market-prices">📈 Market Prices</Link>
              <Link className="glass-action-pill" to="/disease-detection">🔬 Disease Scanner</Link>
            </div>
          </div>
          <div className="circular-glowing-container" style={{ flexShrink: 0, width: "220px", height: "220px" }}>
            <img src={farmLogo} alt="IntelliFarm AI logo" style={{ width: "180px", height: "180px", objectFit: "contain" }} />
          </div>
        </section>

        {/* 2. Statistics Row: 4 Columns */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "28px", position: "relative", zIndex: 1 }}>
          <div className="liquid-glass-card liquid-glass-kpi-card">
            <span style={{ fontSize: "32px" }}>🌾</span>
            <div>
              <span style={{ fontSize: "10px", color: "#8e918f", fontWeight: 700, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>ACTIVE FARMS</span>
              <h3 style={{ fontSize: "28px", color: "var(--body-color)", margin: "2px 0 0 0", fontWeight: 800 }}>{farms.length}</h3>
              <small style={{ fontSize: "10px", color: "#5b6b62" }}>Registered fields</small>
            </div>
          </div>
          
          <div className="liquid-glass-card liquid-glass-kpi-card">
            <span style={{ fontSize: "32px" }}>    🔔</span>
            <div>
              <span style={{ fontSize: "10px", color: "#8e918f", fontWeight: 700, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>ALERTS</span>
              <h3 style={{ fontSize: "28px", color: "#e53935", margin: "2px 0 0 0", fontWeight: 800 }}>{realAlerts.length}</h3>
              <small style={{ fontSize: "10px", color: "#5b6b62" }}>Active warnings</small>
            </div>
          </div>

          <div className="liquid-glass-card liquid-glass-kpi-card">
            <span style={{ fontSize: "32px" }}>🔬</span>
            <div>
              <span style={{ fontSize: "10px", color: "#8e918f", fontWeight: 700, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>DISEASE REPORTS</span>
              <h3 style={{ fontSize: "28px", color: "var(--sidebar-active-color, #2e7d32)", margin: "2px 0 0 0", fontWeight: 800 }}>{reportsCount}</h3>
              <small style={{ fontSize: "10px", color: "#5b6b62" }}>AI scans run</small>
            </div>
          </div>

          <div className="liquid-glass-card liquid-glass-kpi-card">
            <span style={{ fontSize: "32px" }}>📈</span>
            <div>
              <span style={{ fontSize: "10px", color: "#8e918f", fontWeight: 700, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" }}>MARKET WATCHLIST</span>
              <h3 style={{ fontSize: "28px", color: "var(--body-color)", margin: "2px 0 0 0", fontWeight: 800 }}>4</h3>
              <small style={{ fontSize: "10px", color: "#5b6b62" }}>Tracked items</small>
            </div>
          </div>
        </div>

        {/* 3. Grid Row 1: 3 Columns (Weather: 1.3fr, AI Recommendation: 1fr, Recent Activity: 1fr) */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: "24px", marginBottom: "28px", position: "relative", zIndex: 1 }}>
          {/* Weather Overview */}
          <div className="liquid-glass-panel dashboard-mid-panel">
            <div>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#8e918f", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Weather Overview</h3>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "4px" }}>
                <span style={{ fontSize: "44px", fontWeight: 800, color: "var(--body-color)", lineHeight: 1 }}>
                  {weatherData ? `${Math.round(weatherData.weather.main.temp)}°C` : "35°C"}
                </span>
                <span style={{ fontSize: "16px", color: "#52b788", fontWeight: "bold" }}>
                  {weatherData ? weatherData.weather.weather[0].main : "Sunny"}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "#5b6b62", margin: "0 0 16px 0" }}>
                📍 {defaultCity} • Feels like {weatherData ? `${Math.round(weatherData.weather.main.feels_like)}°C` : "36°C"}
              </p>
            </div>

            {/* Today's Advice */}
            <div style={{ background: "rgba(82, 183, 136, 0.05)", border: "1px solid rgba(82, 183, 136, 0.15)", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px" }}>
              <span style={{ fontSize: "11px", fontWeight: "bold", color: "#52b788", display: "block", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Today's Advice</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", color: "var(--body-color)" }}>
                <div>✓ Good day for irrigation</div>
                <div>✓ Low disease probability</div>
                <div>✓ Suitable for spraying</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px 12px", borderTop: "1px solid rgba(82, 183, 136, 0.1)", paddingTop: "12px" }}>
              <div>
                <span style={{ fontSize: "10px", color: "#8e918f", display: "block" }}>HUMIDITY</span>
                <strong style={{ fontSize: "13px", color: "var(--body-color)" }}>{weatherData ? `${weatherData.weather.main.humidity}%` : "58%"}</strong>
              </div>
              <div>
                <span style={{ fontSize: "10px", color: "#8e918f", display: "block" }}>WIND SPEED</span>
                <strong style={{ fontSize: "13px", color: "var(--body-color)" }}>{weatherData ? `${weatherData.weather.wind.speed} m/s` : "3.6 m/s"}</strong>
              </div>
              <div>
                <span style={{ fontSize: "10px", color: "#8e918f", display: "block" }}>RAIN WATCH</span>
                <strong style={{ fontSize: "13px", color: "var(--body-color)" }}>{weatherData ? (weatherData.rainfallProbability ? "Expected" : "Clear") : "Clear"}</strong>
              </div>
              <div>
                <span style={{ fontSize: "10px", color: "#8e918f", display: "block" }}>UV INDEX</span>
                <strong style={{ fontSize: "13px", color: "var(--body-color)" }}>Low (3)</strong>
              </div>
            </div>
          </div>

          {/* AI Crop Recommendation */}
          <div className="liquid-glass-panel dashboard-mid-panel">
            <div>
              <h3 style={{ margin: "0 0 14px 0", fontSize: "14px", color: "#8e918f", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>AI Crop Recommendation</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <span style={{ fontSize: "36px" }}>🌾</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: "18px", color: "var(--sidebar-active-color, #52b788)", fontWeight: 800 }}>{recommendedCrop?.name || "Paddy"}</h4>
                  <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "rgba(82, 183, 136, 0.12)", color: "#52b788", fontWeight: 700, textTransform: "uppercase" }}>
                    SUGGESTED Choice
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--body-color)" }}>
                  <span style={{ color: "#52b788", fontWeight: "bold" }}>✓</span>
                  <span>Perfect soil match ({recommendedCrop?.suitability || "Clayey"})</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--body-color)" }}>
                  <span style={{ color: "#52b788", fontWeight: "bold" }}>✓</span>
                  <span>Monsoon forecast compatibility</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--body-color)" }}>
                  <span style={{ color: "#52b788", fontWeight: "bold" }}>✓</span>
                  <span>High demand trend index</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", borderTop: "1px solid rgba(82, 183, 136, 0.1)", paddingTop: "12px" }}>
              <div>
                <span style={{ fontSize: "9px", color: "#8e918f", display: "block", textTransform: "uppercase" }}>Yield</span>
                <strong style={{ fontSize: "12px", color: "var(--body-color)" }}>7.8 T/Ac</strong>
              </div>
              <div>
                <span style={{ fontSize: "9px", color: "#8e918f", display: "block", textTransform: "uppercase" }}>Profit</span>
                <strong style={{ fontSize: "12px", color: "#52b788" }}>High</strong>
              </div>
              <div>
                <span style={{ fontSize: "9px", color: "#8e918f", display: "block", textTransform: "uppercase" }}>Trend</span>
                <strong style={{ fontSize: "12px", color: "#52b788" }}>Bullish</strong>
              </div>
            </div>
          </div>

          {/* Recent Activity Timeline */}
          <div className="liquid-glass-panel dashboard-activity-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <h3 style={{ margin: 0, fontSize: "14px", color: "#8e918f", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent Activity</h3>
              <Link className="glass-btn-secondary" to="/alerts" style={{ padding: "4px 8px", fontSize: "11px", textDecoration: "none" }}>View All</Link>
            </div>
            <div className="dashboard-activity-list">
              {loadingAlerts ? (
                <p style={{ fontSize: "13px" }}>Loading activity timeline...</p>
              ) : realAlerts.length === 0 ? (
                <>
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <span style={{ fontSize: "11px", color: "#8e918f" }}>2h ago</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--body-color)", fontWeight: "600" }}>Disease scan completed</p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#5b6b62" }}>Field A leaf scan registered clean.</p>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot" style={{ background: "#fb8c00", boxShadow: "0 0 8px #fb8c00" }}></div>
                    <span style={{ fontSize: "11px", color: "#8e918f" }}>4h ago</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--body-color)", fontWeight: "600" }}>Heavy rain alert</p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#5b6b62" }}>Expected precipitation above 25mm.</p>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot" style={{ background: "#2196f3", boxShadow: "0 0 8px #2196f3" }}></div>
                    <span style={{ fontSize: "11px", color: "#8e918f" }}>6h ago</span>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--body-color)", fontWeight: "600" }}>Market trend updated</p>
                    <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#5b6b62" }}>Paddy mandi wholesale prices rose 2%.</p>
                  </div>
                </>
              ) : (
                realAlerts.slice(0, 5).map((alert, idx) => {
                  const times = ["2h ago", "4h ago", "6h ago", "12h ago", "1d ago"];
                  const colors = [
                    alert.severity === "high" ? "#e53935" : alert.severity === "medium" ? "#fb8c00" : "#52b788",
                    alert.severity === "high" ? "#e53935" : alert.severity === "medium" ? "#fb8c00" : "#52b788",
                    alert.severity === "high" ? "#e53935" : alert.severity === "medium" ? "#fb8c00" : "#52b788",
                    alert.severity === "high" ? "#e53935" : alert.severity === "medium" ? "#fb8c00" : "#52b788",
                    alert.severity === "high" ? "#e53935" : alert.severity === "medium" ? "#fb8c00" : "#52b788",
                  ];
                  return (
                    <div className="timeline-item" key={alert.id}>
                      <div className="timeline-dot" style={{ background: colors[idx], boxShadow: `0 0 8px ${colors[idx]}` }}></div>
                      <span style={{ fontSize: "11px", color: "#8e918f" }}>{times[idx] || "1d ago"}</span>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--body-color)", fontWeight: "600" }}>{alert.title}</p>
                      <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#5b6b62" }}>{alert.message}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 4. Grid Row 2: Market Prices (2fr) & Quick AI Scan (1fr) */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "28px", position: "relative", zIndex: 1 }}>
          {/* Market Prices Today Table */}
          <div className="liquid-glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", color: "#8e918f", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Market Prices Today</h3>
              <Link className="glass-btn-secondary" to="/market-prices" style={{ padding: "4px 8px", fontSize: "11px", textDecoration: "none" }}>View Trends</Link>
            </div>
            <table className="market-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Price</th>
                  <th>Trend</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span style={{ marginRight: "8px" }}>🌾</span><strong>Paddy</strong></td>
                  <td><strong>₹2,340</strong></td>
                  <td style={{ color: "#52b788", fontWeight: "bold" }}>▲ +1.2%</td>
                </tr>
                <tr>
                  <td><span style={{ marginRight: "8px" }}>🍅</span><strong>Tomato</strong></td>
                  <td><strong>₹1,870</strong></td>
                  <td style={{ color: "#e53935", fontWeight: "bold" }}>▼ -0.5%</td>
                </tr>
                <tr>
                  <td><span style={{ marginRight: "8px" }}>🌽</span><strong>Maize</strong></td>
                  <td><strong>₹1,920</strong></td>
                  <td style={{ color: "#52b788", fontWeight: "bold" }}>▲ +0.8%</td>
                </tr>
                <tr>
                  <td><span style={{ marginRight: "8px" }}>🧶</span><strong>Cotton</strong></td>
                  <td><strong>₹6,520</strong></td>
                  <td style={{ color: "#52b788", fontWeight: "bold" }}>▲ +2.4%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quick AI Scan Drag & Drop */}
          <div className="liquid-glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#8e918f", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Quick AI Scan</h3>
            <Link to="/disease-detection" style={{ flex: 1, textDecoration: "none", display: "flex", flexDirection: "column" }}>
              <div style={{
                flex: 1,
                border: "2px dashed rgba(82, 183, 136, 0.4)",
                borderRadius: "14px",
                background: "rgba(82, 183, 136, 0.03)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              className="quick-scan-dropzone"
              >
                <span style={{ fontSize: "36px", marginBottom: "10px" }}>📸</span>
                <strong style={{ fontSize: "14px", color: "var(--body-color)", display: "block", marginBottom: "4px" }}>Upload leaf image</strong>
                <span style={{ fontSize: "11px", color: "#8e918f" }}>Supports JPG, PNG formats</span>
              </div>
            </Link>
          </div>
        </div>

        {/* 5. Bottom Row: My Farms (2fr) & Recent Alerts list (1fr) */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "28px", position: "relative", zIndex: 1 }}>
          {/* My Managed Farms */}
          <section className="liquid-glass-panel" style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#8e918f", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>My Managed Farms</h3>
              <Link className="glass-btn-secondary" to="/farms" style={{ padding: "6px 12px", fontSize: "13px", textDecoration: "none" }}>Manage Farms</Link>
            </div>
            
            <div style={{ flex: 1 }}>
              {farms.length === 0 ? (
                <div style={{ padding: "32px", border: "1px dashed rgba(82, 183, 136, 0.2)", borderRadius: "12px", background: "rgba(82, 183, 136, 0.02)", textAlign: "center" }}>
                  <p style={{ margin: "0 0 12px 0", color: "var(--body-color)", fontWeight: "700" }}>No farms registered yet.</p>
                  <Link className="glass-btn-primary" to="/farms" style={{ fontSize: "13px", padding: "8px 16px", textDecoration: "none" }}>
                    Add Your First Farm
                  </Link>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                  {farms.slice(0, 3).map((farm) => (
                    <article key={farm.id} className="liquid-glass-card" style={{ padding: "16px" }}>
                      <h4 style={{ margin: "0 0 4px 0", color: "var(--body-color)", fontSize: "15px", fontWeight: "bold" }}>{farm.name}</h4>
                      {farm.location && <span style={{ fontSize: "11px", color: "#8e918f", display: "block", marginBottom: "8px" }}>📍 {farm.location}</span>}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginTop: "12px", borderTop: "1px solid rgba(82, 183, 136, 0.08)", paddingTop: "8px" }}>
                        <span>Crop: <strong style={{ color: "var(--sidebar-active-color, #2e7d32)" }}>{farm.crop}</strong></span>
                        <span>Soil: <strong style={{ color: "var(--body-color)" }}>{farm.soilType}</strong></span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Recent Smart Alerts Warnings list */}
          <section className="liquid-glass-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#8e918f", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Recent Smart Alerts</h3>
              <Link className="glass-btn-secondary" to="/alerts" style={{ padding: "6px 12px", fontSize: "13px", textDecoration: "none" }}>View All</Link>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {realAlerts.length === 0 ? (
                <p style={{ margin: 0, color: "#666", fontStyle: "italic", fontSize: "13px" }}>No active alerts at this time.</p>
              ) : (
                realAlerts.slice(0, 2).map((alert) => (
                  <article
                    key={alert.id}
                    className="liquid-glass-card"
                    style={{
                      padding: "14px",
                      borderLeft: `4px solid ${
                        alert.severity === "high"
                          ? "#e53935"
                          : alert.severity === "medium"
                          ? "#fb8c00"
                          : "#52b788"
                      }`,
                      background: "var(--glass-bg)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "13px", color: "var(--body-color)" }}>{alert.title}</strong>
                      <span
                        style={{
                          fontSize: "9px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "rgba(82, 183, 136, 0.08)",
                          color: "var(--sidebar-active-color, #2e7d32)"
                        }}
                      >
                        {alert.category}
                      </span>
                    </div>
                    <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#5b6b62", lineHeight: "1.4" }}>
                      {alert.message}
                    </p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
