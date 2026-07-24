import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import farmLogo from "../assets/intellifarm-icon.png";
import {
  Sun,
  CloudSun,
  Leaf,
  Sparkles,
  Droplet,
  Wind,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Sprout
} from "lucide-react";
import { fetchFarms } from "../services/farmApi";
import { fetchWeather, fetchForecast, fetchWeatherAdvisory } from "../services/weatherApi";

interface Farm {
  id: string;
  name: string;
  location?: string;
  crop: string;
  cropVariety?: string;
  soilType?: string;
  area?: string;
  sowingDate?: string;
  irrigationMethod?: string;
}

interface Reminder {
  id: string;
  type: "irrigation" | "spray" | "care";
  title: string;
  timeWindow: string;
  description: string;
  status: "optimal" | "warning" | "done";
  icon: any;
}

const Dashboard: React.FC = () => {
  const { farmer } = useAuth() as any;

  // Active farms state
  const [farms, setFarms] = useState<Farm[]>([]);
  const [activeFarm, setActiveFarm] = useState<Farm | null>(null);
  const [loadingFarms, setLoadingFarms] = useState(true);

  // Weather state
  const [weatherData, setWeatherData] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Spryzen AI Reminders & Advisory
  const [aiAdvisory, setAiAdvisory] = useState<string>("");
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [completedReminders, setCompletedReminders] = useState<Record<string, boolean>>({});

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // Load farms on mount
  useEffect(() => {
    const loadFarmsAndData = async () => {
      setLoadingFarms(true);
      try {
        const res = await fetchFarms();
        const farmList = res.data?.farms || res.data || [];
        if (Array.isArray(farmList) && farmList.length > 0) {
          setFarms(farmList);
          const firstFarm = farmList[0];
          setActiveFarm(firstFarm);
          
          // Fetch weather & compute AI reminders for active farm
          loadWeatherAndReminders(firstFarm);
        } else {
          setFarms([]);
          setActiveFarm(null);
        }
      } catch (err) {
        console.warn("[Dashboard] Could not fetch farms:", err);
        setFarms([]);
        setActiveFarm(null);
      } finally {
        setLoadingFarms(false);
      }
    };

    loadFarmsAndData();
  }, []);

  // Compute Weather & Spryzen AI Reminders for selected farm
  const loadWeatherAndReminders = async (farm: Farm) => {
    setLoadingWeather(true);
    try {
      const city = farm.location || farmer?.location || farmer?.pincode || "Hyderabad";
      
      const [wRes, fRes] = await Promise.all([
        fetchWeather({ city }),
        fetchForecast({ city })
      ]);

      const w = wRes.data?.data;
      const f = fRes.data?.data;

      setWeatherData(w);
      setForecastData(f);

      // Analyze weather variables
      const temp = Math.round(w?.main?.temp || 28);
      const humidity = w?.main?.humidity || 65;
      const windSpeed = w?.wind?.speed || 2.5;

      const rainSlots = f?.list?.slice(0, 8).filter((slot: any) =>
        slot.weather?.[0]?.main?.toLowerCase().includes("rain")
      ) || [];
      const rainCount = rainSlots.length;
      const isRaining = rainCount > 0;

      // Spryzen AI Advisory
      try {
        const advRes = await fetchWeatherAdvisory({
          temp,
          humidity,
          windSpeed,
          rainSlotsCount: rainCount,
          cityName: w?.name || city,
          cropName: farm.crop || "Crop"
        });
        if (advRes.data?.success) {
          setAiAdvisory(advRes.data.advisory);
        }
      } catch (advErr) {
        console.warn("[Dashboard] AI Advisory warning:", advErr);
      }

      // Generate 3 Smart Farm Reminders
      const newReminders: Reminder[] = [
        {
          id: "irrigation-rem",
          type: "irrigation",
          title: "Irrigation Schedule",
          timeWindow: isRaining ? "Hold Off (Rain Forecasted)" : "Today 5:30 PM – 7:00 PM",
          description: isRaining
            ? `Natural rainfall predicted in next 24h for ${farm.name}. Defer drip irrigation to avoid waterlogging.`
            : `Water 15–20 L/m² for ${farm.crop} during low-evaporation evening hours (${farm.irrigationMethod || 'Drip Irrigation'}).`,
          status: isRaining ? "warning" : "optimal",
          icon: Droplet
        },
        {
          id: "spray-rem",
          type: "spray",
          title: "Pesticide & Foliar Spray Window",
          timeWindow: windSpeed < 4.5 && !isRaining ? "Tomorrow 7:00 AM – 9:00 AM" : "Avoid Spraying Today",
          description: windSpeed < 4.5 && !isRaining
            ? `Optimal spray window for ${farm.crop}. Low wind speed (${windSpeed} m/s) ensures zero drift risk and maximum absorption.`
            : `High wind (${windSpeed} m/s) or rain risk. Spraying today may result in drift or chemical wash-off.`,
          status: windSpeed < 4.5 && !isRaining ? "optimal" : "warning",
          icon: Wind
        },
        {
          id: "care-rem",
          type: "care",
          title: "Crop Care & Soil Inspection",
          timeWindow: "Today 4:00 PM",
          description: humidity > 75
            ? `High relative humidity (${humidity}%) increases fungal spore risk on ${farm.crop} (${farm.soilType || 'Soil'}). Prune bottom leaves for airflow.`
            : `Favorable growing conditions (${temp}°C). Inspect soil moisture levels and check for early leaf spot symptoms.`,
          status: "optimal",
          icon: Sprout
        }
      ];

      setReminders(newReminders);

    } catch (err) {
      console.warn("[Dashboard] Weather/Reminders fetch error:", err);
    } finally {
      setLoadingWeather(false);
    }
  };

  const toggleReminderDone = (id: string) => {
    setCompletedReminders((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <MainLayout
      eyebrow=""
      title=""
      subtitle=""
      actions={
        <Link className="glass-btn-primary" style={{ textDecoration: "none" }} to="/copilot">
          Ask Spryzen AI Assistant
        </Link>
      }
      isDashboard={true}
    >
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Floating Background Orbs */}
        <div style={{ position: "absolute", top: "40px", left: "-60px", width: "350px", height: "350px", borderRadius: "50%", background: "rgba(47, 184, 107, 0.05)", filter: "blur(110px)", zIndex: 0, pointerEvents: "none" }}></div>
        <div style={{ position: "absolute", top: "40%", left: "35%", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(56, 189, 248, 0.04)", filter: "blur(110px)", zIndex: 0, pointerEvents: "none" }}></div>

        {/* Hero Banner Section */}
        <section className="hero-banner">
          <Leaf className="hero-decoration" style={{ top: "10%", left: "15%", width: 22, height: 22, color: "#2FB86B", animationDelay: "1s" }} />
          <Sun className="hero-decoration" style={{ bottom: "15%", left: "5%", width: 22, height: 22, color: "#FF9F43", animationDelay: "3s" }} />
          <CloudSun className="hero-decoration" style={{ top: "25%", left: "45%", width: 22, height: 22, color: "#0288D1", animationDelay: "5s" }} />

          <div className="hero-left">
            <span className="hero-greeting">
              {getGreeting()}, {farmer?.name || "Farmer"}!
            </span>
            <h1 className="hero-title">
              Welcome to Intelli<span style={{ color: "#2FB86B" }}>Farm</span> AI
            </h1>
            <p className="hero-description" style={{ marginBottom: 0 }}>
              Access smart farming diagnostics, weather forecasting, and real-time agricultural advisories.
            </p>
          </div>

          <div className="hero-right">
            <img
              src={farmLogo}
              alt="IntelliFarm AI Logo"
              className="hero-image"
              style={{
                maxHeight: "180px",
                maxWidth: "180px",
                filter: "drop-shadow(0 8px 30px rgba(47, 184, 107, 0.2))",
                animation: "imageFloat 6s ease-in-out infinite"
              }}
            />
          </div>
        </section>

        {/* ── LIQUID GLASS REMINDER BOX (Only rendered if user has active farms) ── */}
        {!loadingFarms && farms.length > 0 && activeFarm && (
          <section className="liquid-glass-reminder-card">
            {/* Glossy liquid glass background overlay */}
            <div className="liquid-glass-shimmer" />

            {/* Header */}
            <div className="liquid-reminder-header">
              <div className="liquid-header-left">
                <div className="liquid-sparkle-badge">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="liquid-reminder-title">Spryzen AI Farm Reminders</h3>
                  <p className="liquid-reminder-sub">Real-time schedule for irrigation, spraying, and crop protection</p>
                </div>
              </div>

              {/* Active Farm Selector Badge */}
              <div className="liquid-farm-selector">
                <MapPin size={14} className="liquid-pin-icon" />
                <select
                  value={activeFarm.id}
                  onChange={(e) => {
                    const selected = farms.find((f) => f.id === e.target.value);
                    if (selected) {
                      setActiveFarm(selected);
                      loadWeatherAndReminders(selected);
                    }
                  }}
                  className="liquid-farm-dropdown"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.crop})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Weather & AI Advisory Bar */}
            {weatherData && (
              <div className="liquid-weather-bar">
                <div className="liquid-weather-info">
                  <span className="liquid-weather-city">📍 {weatherData.name}</span>
                  <span className="liquid-weather-temp">{Math.round(weatherData.main?.temp)}°C</span>
                  <span className="liquid-weather-cond">{weatherData.weather?.[0]?.main}</span>
                  <span className="liquid-weather-detail">💧 {weatherData.main?.humidity}% Humidity</span>
                  <span className="liquid-weather-detail">💨 {weatherData.wind?.speed} m/s Wind</span>
                </div>
              </div>
            )}

            {/* AI Summary Banner */}
            {aiAdvisory && (
              <div className="liquid-ai-summary">
                <Sparkles size={16} className="liquid-sparkle-inline" />
                <span>{aiAdvisory}</span>
              </div>
            )}

            {/* Loading Indicator for Reminders */}
            {loadingWeather ? (
              <div className="liquid-loading-box">
                <Loader2 size={24} className="spinner" style={{ color: "#2e7d32" }} />
                <span>Calculating optimal farming windows for {activeFarm.name}...</span>
              </div>
            ) : (
              /* Reminder Items List */
              <div className="liquid-reminders-list">
                {reminders.map((rem) => {
                  const IconComp = rem.icon;
                  const isDone = !!completedReminders[rem.id];
                  return (
                    <div
                      key={rem.id}
                      className={`liquid-reminder-item ${rem.status} ${isDone ? "completed" : ""}`}
                    >
                      <div className="liquid-item-left">
                        <div className={`liquid-item-icon-wrapper ${rem.type}`}>
                          <IconComp size={20} />
                        </div>
                        <div className="liquid-item-details">
                          <div className="liquid-item-title-row">
                            <strong className="liquid-item-title">{rem.title}</strong>
                            <span className={`liquid-time-badge ${rem.status}`}>
                              <Clock size={12} />
                              {rem.timeWindow}
                            </span>
                          </div>
                          <p className="liquid-item-desc">{rem.description}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`liquid-check-btn ${isDone ? "done" : ""}`}
                        onClick={() => toggleReminderDone(rem.id)}
                        title={isDone ? "Mark as pending" : "Mark task complete"}
                      >
                        <CheckCircle2 size={20} />
                        <span>{isDone ? "Completed" : "Mark Done"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Card Footer Link */}
            <div className="liquid-card-footer">
              <Link to={`/weather?farmName=${encodeURIComponent(activeFarm.name)}&city=${encodeURIComponent(activeFarm.location || '')}`} className="liquid-footer-link">
                <span>View Full Weather & Agronomy Forecast</span>
                <ChevronRight size={16} />
              </Link>
            </div>

          </section>
        )}

      </div>

      {/* ── Liquid Glass Theme CSS ── */}
      <style>{`
        /* Liquid Glass Reminder Container */
        .liquid-glass-reminder-card {
          position: relative;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(240, 253, 244, 0.78) 100%);
          border: 1.5px solid rgba(46, 125, 50, 0.22);
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 16px 40px rgba(46, 125, 50, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          display: flex;
          flex-direction: column;
          gap: 20px;
          overflow: hidden;
          box-sizing: border-box;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: liquidFadeSlide 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        [data-theme="dark"] .liquid-glass-reminder-card {
          background: linear-gradient(135deg, rgba(20, 35, 24, 0.88) 0%, rgba(12, 24, 16, 0.78) 100%);
          border-color: rgba(74, 222, 128, 0.25);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        @keyframes liquidFadeSlide {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .liquid-glass-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          transform: skewX(-25deg);
          pointer-events: none;
          animation: liquidShimmer 8s infinite ease-in-out;
        }

        @keyframes liquidShimmer {
          0% { left: -100%; }
          30%, 100% { left: 200%; }
        }

        /* Header */
        .liquid-reminder-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .liquid-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .liquid-sparkle-badge {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2e7d32, #10b981);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(46, 125, 50, 0.3);
          flex-shrink: 0;
        }

        .liquid-reminder-title {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: var(--body-color, #183d24);
          letter-spacing: -0.3px;
        }

        [data-theme="dark"] .liquid-reminder-title {
          color: #f0fdf4;
        }

        .liquid-reminder-sub {
          margin: 2px 0 0;
          font-size: 13px;
          color: var(--text-main, #5b6b62);
        }

        /* Farm Dropdown Selector */
        .liquid-farm-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 16px;
          background: rgba(46, 125, 50, 0.08);
          border: 1px solid rgba(46, 125, 50, 0.2);
        }

        [data-theme="dark"] .liquid-farm-selector {
          background: rgba(74, 222, 128, 0.1);
          border-color: rgba(74, 222, 128, 0.25);
        }

        .liquid-pin-icon {
          color: #2e7d32;
        }

        [data-theme="dark"] .liquid-pin-icon {
          color: #4ade80;
        }

        .liquid-farm-dropdown {
          background: transparent;
          border: none;
          font-size: 13.5px;
          font-weight: 700;
          color: #2e7d32;
          outline: none;
          cursor: pointer;
        }

        [data-theme="dark"] .liquid-farm-dropdown {
          color: #4ade80;
        }

        /* Weather Bar */
        .liquid-weather-bar {
          padding: 10px 16px;
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        [data-theme="dark"] .liquid-weather-bar {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .liquid-weather-info {
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 13px;
          font-weight: 700;
          color: var(--body-color, #183d24);
          flex-wrap: wrap;
        }

        [data-theme="dark"] .liquid-weather-info {
          color: #f0fdf4;
        }

        .liquid-weather-temp {
          font-weight: 800;
          color: #2e7d32;
        }

        [data-theme="dark"] .liquid-weather-temp {
          color: #4ade80;
        }

        /* AI Summary */
        .liquid-ai-summary {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(46, 125, 50, 0.08);
          border: 1px solid rgba(46, 125, 50, 0.18);
          font-size: 13.5px;
          line-height: 1.5;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .liquid-ai-summary {
          background: rgba(74, 222, 128, 0.08);
          border-color: rgba(74, 222, 128, 0.2);
          color: #f0fdf4;
        }

        .liquid-sparkle-inline {
          color: #2e7d32;
          flex-shrink: 0;
        }

        [data-theme="dark"] .liquid-sparkle-inline {
          color: #4ade80;
        }

        /* Loading Box */
        .liquid-loading-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 24px;
          font-size: 14px;
          color: var(--text-main, #6b7c72);
        }

        /* Reminders List */
        .liquid-reminders-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .liquid-reminder-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(0, 0, 0, 0.06);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.02);
        }

        [data-theme="dark"] .liquid-reminder-item {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .liquid-reminder-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(46, 125, 50, 0.1);
        }

        .liquid-reminder-item.completed {
          opacity: 0.6;
          background: rgba(0, 0, 0, 0.02);
        }

        .liquid-item-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .liquid-item-icon-wrapper {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .liquid-item-icon-wrapper.irrigation {
          background: rgba(2, 132, 199, 0.12);
          color: #0284c7;
        }

        .liquid-item-icon-wrapper.spray {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }

        .liquid-item-icon-wrapper.care {
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
        }

        .liquid-item-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .liquid-item-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .liquid-item-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .liquid-item-title {
          color: #f0fdf4;
        }

        .liquid-time-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 10px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 700;
        }

        .liquid-time-badge.optimal {
          background: rgba(16, 185, 129, 0.12);
          color: #047857;
        }

        [data-theme="dark"] .liquid-time-badge.optimal {
          background: rgba(74, 222, 128, 0.15);
          color: #4ade80;
        }

        .liquid-time-badge.warning {
          background: rgba(239, 68, 68, 0.12);
          color: #dc2626;
        }

        [data-theme="dark"] .liquid-time-badge.warning {
          background: rgba(248, 113, 113, 0.15);
          color: #f87171;
        }

        .liquid-item-desc {
          margin: 0;
          font-size: 13px;
          color: var(--text-main, #5b6b62);
          line-height: 1.45;
        }

        [data-theme="dark"] .liquid-item-desc {
          color: #d1fae5;
        }

        /* Check Button */
        .liquid-check-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          background: rgba(46, 125, 50, 0.08);
          border: 1.5px solid rgba(46, 125, 50, 0.2);
          color: #2e7d32;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        [data-theme="dark"] .liquid-check-btn {
          background: rgba(74, 222, 128, 0.1);
          border-color: rgba(74, 222, 128, 0.25);
          color: #4ade80;
        }

        .liquid-check-btn:hover {
          background: rgba(46, 125, 50, 0.15);
          transform: scale(1.02);
        }

        .liquid-check-btn.done {
          background: #10b981;
          color: #ffffff;
          border-color: #10b981;
        }

        /* Footer Link */
        .liquid-card-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 4px;
        }

        .liquid-footer-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #2e7d32;
          text-decoration: none;
          transition: gap 0.2s ease;
        }

        [data-theme="dark"] .liquid-footer-link {
          color: #4ade80;
        }

        .liquid-footer-link:hover {
          gap: 10px;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .liquid-reminder-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .liquid-check-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default Dashboard;
