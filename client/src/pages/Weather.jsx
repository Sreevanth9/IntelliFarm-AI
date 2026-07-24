import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Droplet,
  Wind,
  CloudRain,
  CloudSun,
  Sun,
  Cloud,
  CloudLightning,
  Sparkles,
  MapPin,
  AlertTriangle,
  Loader2,
  Clock,
  Sunrise,
  Sunset,
  Calendar,
  CheckCircle,
  XCircle
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import { fetchForecast, fetchWeather, fetchWeatherAdvisory } from "../services/weatherApi";
import { fetchProfile } from "../services/profileApi";
import { useLocation } from "react-router-dom";

const Weather = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [advisory, setAdvisory] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationPrompt, setLocationPrompt] = useState(false);

  const routerLocation = useLocation();
  const urlParams = new URLSearchParams(routerLocation.search);
  const [farmName] = useState(urlParams.get("farmName") || "");

  const fetchWeatherForCity = async (cityName) => {
    if (!cityName) return;
    setLoading(true);
    setError("");
    setAdvisory("");

    try {
      const [weatherResult, forecastResult] = await Promise.all([
        fetchWeather({ city: cityName }),
        fetchForecast({ city: cityName }),
      ]);
      const w = weatherResult.data.data;
      const f = forecastResult.data.data;
      setWeather(w);
      setForecast(f);

      // Rain slots count in 24h
      const rainCount = f.list?.slice(0, 8).filter((item) =>
        item.weather?.[0]?.main?.toLowerCase().includes("rain")
      ).length || 0;

      // Spryzen AI Advisory
      try {
        const advResult = await fetchWeatherAdvisory({
          temp: Math.round(w.main.temp),
          humidity: w.main.humidity,
          windSpeed: w.wind.speed,
          rainSlotsCount: rainCount,
          cityName: w.name,
          cropName: "General Crop"
        });
        if (advResult.data.success) {
          setAdvisory(advResult.data.advisory);
        }
      } catch (advErr) {
        console.warn("Spryzen AI advisory warning:", advErr);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load weather for this location.");
      toast.error("Weather fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCity = params.get("city");
    if (urlCity) {
      setCity(urlCity);
      fetchWeatherForCity(urlCity);
      return;
    }

    const initWeather = async () => {
      try {
        const profileRes = await fetchProfile();
        const loc = profileRes.data?.profile?.location || profileRes.data?.location;
        if (loc && loc.trim()) {
          setCity(loc.trim());
          fetchWeatherForCity(loc.trim());
          return;
        }
      } catch (e) {}

      const localLocation = localStorage.getItem("location");
      if (localLocation && localLocation.trim()) {
        const cached = localLocation.split(",")[0].trim();
        setCity(cached);
        fetchWeatherForCity(cached);
        return;
      }

      setLocationPrompt(true);
    };

    initWeather();
  }, []);

  const submitHandler = async (event) => {
    event.preventDefault();
    if (!city.trim()) return;
    setLocationPrompt(false);
    localStorage.setItem("location", city.trim());
    fetchWeatherForCity(city.trim());
  };

  const getConditionIcon = (main, size = 24) => {
    const m = (main || "").toLowerCase();
    if (m.includes("rain")) return <CloudRain size={size} style={{ color: "#0284c7" }} />;
    if (m.includes("thunderstorm")) return <CloudLightning size={size} style={{ color: "#7c3aed" }} />;
    if (m.includes("clear") || m.includes("sun")) return <Sun size={size} style={{ color: "#eab308" }} />;
    if (m.includes("cloud")) return <CloudSun size={size} style={{ color: "#059669" }} />;
    return <Cloud size={size} style={{ color: "#6b7280" }} />;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const getWeeklyForecast = () => {
    if (!forecast?.list) return [];
    const days = {};
    forecast.list.forEach((slot) => {
      const dateStr = new Date(slot.dt * 1000).toDateString();
      if (!days[dateStr]) days[dateStr] = [];
      days[dateStr].push(slot);
    });

    return Object.keys(days).slice(1, 6).map((dayStr) => {
      const slots = days[dayStr];
      const middaySlot = slots.find((s) => new Date(s.dt * 1000).getHours() === 12) || slots[Math.floor(slots.length / 2)];
      const minTemp = Math.min(...slots.map((s) => s.main.temp_min));
      const maxTemp = Math.max(...slots.map((s) => s.main.temp_max));
      return {
        dayName: new Date(middaySlot.dt * 1000).toLocaleDateString("en-US", { weekday: "short" }),
        tempMin: Math.round(minTemp),
        tempMax: Math.round(maxTemp),
        pop: Math.round(middaySlot.pop * 100),
        condition: middaySlot.weather[0].main
      };
    });
  };

  // Rain slots in next 24h
  const rainSlots = forecast?.list?.slice(0, 8).filter((item) =>
    item.weather?.[0]?.main?.toLowerCase().includes("rain")
  ) || [];

  const isWindy = weather?.wind?.speed > 5;
  const isRaining = rainSlots.length > 0;

  return (
    <MainLayout eyebrow="" title="" subtitle="">
      <div className="weather-wrapper">
        
        {/* Header */}
        <div className="weather-header">
          <h1 className="weather-title">Weather Intelligence</h1>
          <p className="weather-sub">Simple, actionable weather insights for your farm.</p>
          {farmName && (
            <div className="weather-farm-badge">
              <MapPin size={13} /> {farmName}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <form className="weather-search-box" onSubmit={submitHandler}>
          <div className="weather-search-input-group">
            <Search size={18} className="weather-search-icon" />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name or pincode (e.g. Hyderabad, 500001)..."
              className="weather-search-input"
            />
          </div>
          <button type="submit" className="weather-search-btn" disabled={loading}>
            {loading ? <Loader2 size={16} className="spinner" /> : "Check Weather"}
          </button>
        </form>

        {/* Loading State */}
        {loading && (
          <div className="weather-state-card">
            <Loader2 size={40} className="spinner" style={{ color: "#2e7d32" }} />
            <p>Fetching weather insights...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="weather-error-box">
            <AlertTriangle size={24} />
            <p>{error}</p>
          </div>
        )}

        {/* Location Prompt */}
        {locationPrompt && !loading && !weather && !error && (
          <div className="weather-state-card">
            <MapPin size={40} style={{ color: "#2e7d32" }} />
            <h2>Enter your farm location</h2>
            <p>Type your city or pincode above to load live weather and farming advice.</p>
          </div>
        )}

        {/* MAIN WEATHER CONTENT */}
        {weather && !loading && !error && (
          <div className="weather-main-content">
            
            {/* 1. Main Hero Weather Card */}
            <div className="weather-hero-card">
              <div className="weather-hero-left">
                <div className="weather-location-row">
                  <MapPin size={20} className="weather-pin-icon" />
                  <h2>{weather.name}</h2>
                </div>
                <div className="weather-temp-group">
                  <span className="weather-big-temp">{Math.round(weather.main.temp)}°C</span>
                  <div className="weather-condition-desc">
                    <span className="weather-condition-text">{weather.weather[0].main}</span>
                    <span className="weather-feels-like">Feels like {Math.round(weather.main.feels_like)}°C</span>
                  </div>
                </div>
              </div>

              {/* Essential 4 Metrics */}
              <div className="weather-metrics-bar">
                <div className="weather-metric-pill">
                  <Droplet size={18} className="metric-icon humidity" />
                  <div>
                    <span className="metric-val">{weather.main.humidity}%</span>
                    <span className="metric-lbl">Humidity</span>
                  </div>
                </div>

                <div className="weather-metric-pill">
                  <Wind size={18} className="metric-icon wind" />
                  <div>
                    <span className="metric-val">{weather.wind.speed} m/s</span>
                    <span className="metric-lbl">Wind Speed</span>
                  </div>
                </div>

                <div className="weather-metric-pill">
                  <Sunrise size={18} className="metric-icon sunrise" />
                  <div>
                    <span className="metric-val">{formatTime(weather.sys?.sunrise)}</span>
                    <span className="metric-lbl">Sunrise</span>
                  </div>
                </div>

                <div className="weather-metric-pill">
                  <Sunset size={18} className="metric-icon sunset" />
                  <div>
                    <span className="metric-val">{formatTime(weather.sys?.sunset)}</span>
                    <span className="metric-lbl">Sunset</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Spryzen AI Farming Advice */}
            <div className="weather-ai-card">
              <div className="weather-ai-header">
                <div className="weather-ai-sparkle">
                  <Sparkles size={18} />
                </div>
                <h3>Spryzen AI Advisory for Farmers</h3>
              </div>
              <p className="weather-ai-text">
                {advisory ||
                  `Current temperature is ${Math.round(weather.main.temp)}°C with ${weather.main.humidity}% humidity. ${
                    isRaining
                      ? "Rain is expected in the next 24 hours — hold off on irrigation and chemical spraying."
                      : "Clear conditions ahead — suitable for field activities and regular irrigation."
                  }`}
              </p>
            </div>

            {/* 3. Quick Farmer Action Guidance (3 Status Cards) */}
            <div className="weather-actions-grid">
              <div className={`weather-action-card ${!isRaining ? "safe" : "warning"}`}>
                <div className="action-card-header">
                  <Droplet size={20} />
                  <h4>Irrigation</h4>
                </div>
                <div className="action-status">
                  {!isRaining ? (
                    <>
                      <CheckCircle size={16} />
                      <span>Recommended (Dry Skies)</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      <span>Hold Off (Rain Expected)</span>
                    </>
                  )}
                </div>
              </div>

              <div className={`weather-action-card ${!isWindy && !isRaining ? "safe" : "warning"}`}>
                <div className="action-card-header">
                  <Wind size={20} />
                  <h4>Pesticide Spray</h4>
                </div>
                <div className="action-status">
                  {!isWindy && !isRaining ? (
                    <>
                      <CheckCircle size={16} />
                      <span>Optimal Spray Window</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={16} />
                      <span>Avoid (Risk of Drift/Rain)</span>
                    </>
                  )}
                </div>
              </div>

              <div className={`weather-action-card ${!isRaining ? "safe" : "warning"}`}>
                <div className="action-card-header">
                  <Sun size={20} />
                  <h4>Harvesting</h4>
                </div>
                <div className="action-status">
                  {!isRaining ? (
                    <>
                      <CheckCircle size={16} />
                      <span>Good Conditions (Dry Foliage)</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      <span>Risky (Damp Hazard)</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Forecast Section: Hourly (24h) & 5-Day Weekly */}
            <div className="weather-forecast-grid">
              
              {/* Hourly Timeline */}
              {forecast?.list && (
                <div className="weather-section-card">
                  <div className="weather-section-header">
                    <Clock size={18} />
                    <h3>Hourly Forecast (Next 24h)</h3>
                  </div>
                  <div className="weather-hourly-scroll">
                    {forecast.list.slice(0, 8).map((slot: any, idx: number) => {
                      const timeStr = new Date(slot.dt * 1000).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        hour12: true
                      });
                      const popPerc = Math.round(slot.pop * 100);
                      return (
                        <div key={idx} className="weather-hourly-pill">
                          <span className="hourly-time">{timeStr}</span>
                          <div className="hourly-icon">{getConditionIcon(slot.weather[0].main, 22)}</div>
                          <span className="hourly-temp">{Math.round(slot.main.temp)}°C</span>
                          <span className="hourly-rain">💧 {popPerc}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5-Day Weekly Forecast */}
              <div className="weather-section-card">
                <div className="weather-section-header">
                  <Calendar size={18} />
                  <h3>5-Day Forecast</h3>
                </div>
                <div className="weather-weekly-list">
                  {getWeeklyForecast().map((day, idx) => (
                    <div key={idx} className="weather-weekly-row">
                      <span className="weekly-day-name">{day.dayName}</span>
                      <div className="weekly-condition">
                        {getConditionIcon(day.condition, 20)}
                        <span>{day.condition}</span>
                      </div>
                      <span className="weekly-pop">💧 {day.pop}%</span>
                      <div className="weekly-temps">
                        <span className="temp-high">{day.tempMax}°</span>
                        <span className="temp-low">{day.tempMin}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Simplified, Clean & Mobile Responsive CSS */}
      <style>{`
        .weather-wrapper {
          max-width: 1050px;
          width: 100%;
          margin: 0 auto;
          padding: 0 12px 60px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-sizing: border-box;
          font-family: inherit;
          overflow-x: hidden;
        }

        .weather-header {
          text-align: center;
          padding: 0 8px;
        }

        .weather-title {
          margin: 0 0 4px;
          font-size: 28px;
          font-weight: 800;
          color: var(--body-color, #183d24);
          letter-spacing: -0.4px;
        }

        [data-theme="dark"] .weather-title {
          color: #f0fdf4;
        }

        .weather-sub {
          margin: 0;
          font-size: 14px;
          color: var(--text-main, #5b6b62);
        }

        .weather-farm-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding: 4px 12px;
          border-radius: 99px;
          background: rgba(46, 125, 50, 0.08);
          color: #2e7d32;
          font-size: 12.5px;
          font-weight: 700;
          max-width: 100%;
          word-break: break-word;
        }

        [data-theme="dark"] .weather-farm-badge {
          background: rgba(74, 222, 128, 0.1);
          color: #4ade80;
        }

        /* Search Box */
        .weather-search-box {
          display: flex;
          gap: 10px;
          max-width: 600px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
        }

        .weather-search-input-group {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .weather-search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-main, #6b7c72);
          pointer-events: none;
        }

        .weather-search-input {
          width: 100%;
          padding: 12px 14px 12px 42px;
          border-radius: 14px;
          border: 1.5px solid var(--settings-card-border, rgba(46, 125, 50, 0.2));
          background: rgba(255, 255, 255, 0.85);
          color: var(--body-color, #183d24);
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }

        [data-theme="dark"] .weather-search-input {
          background: rgba(20, 32, 24, 0.85);
          color: #f0fdf4;
          border-color: rgba(74, 222, 128, 0.2);
        }

        .weather-search-input:focus {
          border-color: #2e7d32;
          box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.12);
        }

        .weather-search-btn {
          padding: 12px 20px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2e7d32, #1b5e20);
          color: #ffffff;
          border: none;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          white-space: nowrap;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(46, 125, 50, 0.2);
        }

        .weather-search-btn:disabled {
          opacity: 0.6;
        }

        .weather-state-card {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(46, 125, 50, 0.14);
          border-radius: 20px;
          padding: 32px 16px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          box-sizing: border-box;
          width: 100%;
        }

        [data-theme="dark"] .weather-state-card {
          background: rgba(18, 30, 22, 0.85);
          border-color: rgba(74, 222, 128, 0.16);
          color: #f0fdf4;
        }

        .weather-error-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border-radius: 14px;
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          font-weight: 600;
          max-width: 600px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }

        /* Weather Main Layout */
        .weather-main-content {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
          box-sizing: border-box;
        }

        /* 1. Hero Card */
        .weather-hero-card {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(244, 249, 245, 0.85) 100%);
          border: 1px solid rgba(46, 125, 50, 0.18);
          border-radius: 24px;
          padding: 24px 28px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        [data-theme="dark"] .weather-hero-card {
          background: linear-gradient(135deg, rgba(24, 40, 29, 0.92) 0%, rgba(16, 28, 20, 0.85) 100%);
          border-color: rgba(74, 222, 128, 0.2);
        }

        .weather-hero-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .weather-location-row {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #2e7d32;
        }

        [data-theme="dark"] .weather-location-row {
          color: #4ade80;
        }

        .weather-location-row h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: var(--body-color, #183d24);
          word-break: break-word;
        }

        [data-theme="dark"] .weather-location-row h2 {
          color: #f0fdf4;
        }

        .weather-temp-group {
          display: flex;
          align-items: baseline;
          gap: 16px;
          flex-wrap: wrap;
        }

        .weather-big-temp {
          font-size: 48px;
          font-weight: 900;
          color: var(--body-color, #183d24);
          line-height: 1;
        }

        [data-theme="dark"] .weather-big-temp {
          color: #f0fdf4;
        }

        .weather-condition-desc {
          display: flex;
          flex-direction: column;
        }

        .weather-condition-text {
          font-size: 16px;
          font-weight: 700;
          color: #2e7d32;
        }

        [data-theme="dark"] .weather-condition-text {
          color: #4ade80;
        }

        .weather-feels-like {
          font-size: 13px;
          color: var(--text-main, #6b7c72);
        }

        .weather-metrics-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          min-width: 0;
        }

        .weather-metric-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.025);
          border: 1px solid rgba(0, 0, 0, 0.05);
          min-width: 0;
          box-sizing: border-box;
        }

        [data-theme="dark"] .weather-metric-pill {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .metric-icon.humidity { color: #0284c7; flex-shrink: 0; }
        .metric-icon.wind { color: #10b981; flex-shrink: 0; }
        .metric-icon.sunrise { color: #f59e0b; flex-shrink: 0; }
        .metric-icon.sunset { color: #8b5cf6; flex-shrink: 0; }

        .metric-val {
          display: block;
          font-size: 14px;
          font-weight: 800;
          color: var(--body-color, #183d24);
          white-space: nowrap;

        }

        [data-theme="dark"] .metric-val {
          color: #f0fdf4;
        }

        .metric-lbl {
          font-size: 11px;
          color: var(--text-main, #6b7c72);
          white-space: nowrap;

        }

        /* 2. Spryzen AI Card */
        .weather-ai-card {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(46, 125, 50, 0.16);
          border-radius: 20px;
          padding: 18px 24px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.03);
          box-sizing: border-box;
          width: 100%;
        }

        [data-theme="dark"] .weather-ai-card {
          background: rgba(18, 30, 22, 0.85);
          border-color: rgba(74, 222, 128, 0.18);
        }

        .weather-ai-header {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .weather-ai-sparkle {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(46, 125, 50, 0.12);
          color: #2e7d32;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        [data-theme="dark"] .weather-ai-sparkle {
          background: rgba(74, 222, 128, 0.15);
          color: #4ade80;
        }

        .weather-ai-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          color: #2e7d32;
        }

        [data-theme="dark"] .weather-ai-header h3 {
          color: #4ade80;
        }

        .weather-ai-text {
          margin: 0;
          font-size: 14px;
          line-height: 1.55;
          color: var(--body-color, #183d24);
          word-break: break-word;
        }

        [data-theme="dark"] .weather-ai-text {
          color: #f0fdf4;
        }

        /* 3. Action Cards Grid */
        .weather-actions-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          width: 100%;
          box-sizing: border-box;
        }

        .weather-action-card {
          padding: 16px 18px;
          border-radius: 18px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(255, 255, 255, 0.85);
          display: flex;
          flex-direction: column;
          gap: 6px;
          box-sizing: border-box;
          width: 100%;
        }

        [data-theme="dark"] .weather-action-card {
          background: rgba(18, 30, 22, 0.85);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .weather-action-card.safe {
          border-top: 3px solid #10b981;
        }

        .weather-action-card.warning {
          border-top: 3px solid #f59e0b;
        }

        .action-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .action-card-header {
          color: #f0fdf4;
        }

        .action-card-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 800;
        }

        .action-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12.5px;
          font-weight: 700;
          word-break: break-word;
        }

        .weather-action-card.safe .action-status {
          color: #059669;
        }

        .weather-action-card.warning .action-status {
          color: #d97706;
        }

        /* 4. Forecast Section */
        .weather-forecast-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .weather-section-card {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(46, 125, 50, 0.14);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
        }

        [data-theme="dark"] .weather-section-card {
          background: rgba(18, 30, 22, 0.85);
          border-color: rgba(74, 222, 128, 0.16);
        }

        .weather-section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #2e7d32;
        }

        [data-theme="dark"] .weather-section-header {
          color: #4ade80;
        }

        .weather-section-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .weather-section-header h3 {
          color: #f0fdf4;
        }

        /* Hourly Scroll */
        .weather-hourly-scroll {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
          width: 100%;
          box-sizing: border-box;
          -webkit-overflow-scrolling: touch;
        }

        .weather-hourly-pill {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 10px 12px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.025);
          border: 1px solid rgba(0, 0, 0, 0.05);
          min-width: 68px;
        }

        [data-theme="dark"] .weather-hourly-pill {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .hourly-time {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-main, #6b7c72);
        }

        .hourly-temp {
          font-size: 14px;
          font-weight: 800;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .hourly-temp {
          color: #f0fdf4;
        }

        .hourly-rain {
          font-size: 11px;
          font-weight: 600;
          color: #0284c7;
        }

        /* Weekly List */
        .weather-weekly-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }

        .weather-weekly-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.02);
          font-size: 13px;
          gap: 8px;
          box-sizing: border-box;
          width: 100%;
        }

        [data-theme="dark"] .weather-weekly-row {
          background: rgba(255, 255, 255, 0.03);
        }

        .weekly-day-name {
          font-weight: 800;
          width: 45px;
          flex-shrink: 0;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .weekly-day-name {
          color: #f0fdf4;
        }

        .weekly-condition {
          display: flex;
          align-items: center;
          gap: 6px;
          flex: 1;
          min-width: 0;
        }

        .weekly-condition span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .weekly-pop {
          font-weight: 700;
          color: #0284c7;
          flex-shrink: 0;
          text-align: right;
        }

        .weekly-temps {
          display: flex;
          gap: 6px;
          font-weight: 700;
          flex-shrink: 0;
          justify-content: flex-end;
        }

        .temp-high {
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .temp-high {
          color: #f0fdf4;
        }

        .temp-low {
          color: var(--text-main, #6b7c72);
          opacity: 0.7;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ── Robust Mobile Responsive Breakpoints ── */
        @media (max-width: 850px) {
          .weather-hero-card {
            flex-direction: column;
            align-items: stretch;
            padding: 20px;
          }

          .weather-metrics-bar {
            grid-template-columns: repeat(2, 1fr);
            width: 100%;
          }

          .weather-actions-grid {
            grid-template-columns: 1fr;
          }

          .weather-forecast-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 580px) {
          .weather-wrapper {
            padding: 0 8px 40px;
          }

          .weather-title {
            font-size: 24px;
          }

          .weather-search-box {
            flex-direction: column;
            gap: 8px;
          }

          .weather-search-btn {
            width: 100%;
            padding: 12px;
          }

          .weather-hero-card {
            padding: 16px;
            border-radius: 20px;
          }

          .weather-big-temp {
            font-size: 38px;
          }

          .weather-metrics-bar {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .weather-metric-pill {
            padding: 8px 10px;
            gap: 6px;
          }

          .metric-val {
            font-size: 13px;
          }

          .metric-lbl {
            font-size: 10px;
          }

          .weather-ai-card {
            padding: 16px;
          }

          .weather-section-card {
            padding: 16px;
          }

          .weather-weekly-row {
            padding: 8px 10px;
            font-size: 12px;
          }
        }

        @media (max-width: 380px) {
          .weather-metrics-bar {
            grid-template-columns: 1fr 1fr;
          }

          .weekly-condition span {
            display: none;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default Weather;
