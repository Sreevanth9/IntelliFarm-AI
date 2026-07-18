import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  Search,
  Thermometer,
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
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import EmptyState from "../components/EmptyState/EmptyState";
import { fetchForecast, fetchWeather } from "../services/weatherApi";

const Weather = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchWeatherForCity = async (cityName) => {
    if (!cityName) return;
    setLoading(true);
    setError("");
    try {
      const [weatherResult, forecastResult] = await Promise.all([
        fetchWeather({ city: cityName }),
        fetchForecast({ city: cityName }),
      ]);
      setWeather(weatherResult.data.data);
      setForecast(forecastResult.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load weather right now.");
      toast.error("Weather fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const localLocation = localStorage.getItem("location");
    const initialCity = localLocation ? localLocation.split(",")[0].trim() : "Hyderabad";
    setCity(initialCity);
    fetchWeatherForCity(initialCity);
  }, []);

  const submitHandler = async (event) => {
    event.preventDefault();
    fetchWeatherForCity(city);
  };

  const rainSlots =
    forecast?.list
      ?.slice(0, 8)
      .filter((item) => item.weather?.[0]?.main?.toLowerCase().includes("rain")) || [];

  const getConditionIcon = (main) => {
    const m = (main || "").toLowerCase();
    if (m.includes("rain")) return <CloudRain size={24} />;
    if (m.includes("thunderstorm")) return <CloudLightning size={24} />;
    if (m.includes("clear") || m.includes("sun")) return <Sun size={24} />;
    if (m.includes("cloud")) return <CloudSun size={24} />;
    return <Cloud size={24} />;
  };

  return (
    <MainLayout eyebrow="" title="" subtitle="">
      <div className="weather-page-wrapper">
        
        {/* CENTERED HEADER */}
        <div className="weather-header-centered">
          <h1 className="weather-page-title">Weather Intelligence</h1>
          <p className="weather-page-subtitle">Real-time weather metrics, agricultural recommendations, and rain alerts</p>
        </div>

        {/* SEARCH BAR */}
        <form className="weather-search-form" onSubmit={submitHandler}>
          <div className="weather-search-input-wrapper">
            <Search className="weather-search-icon" size={18} />
            <input
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Search city (e.g. Hyderabad, Washington, Delhi...)"
              className="weather-search-input"
            />
          </div>
          <button type="submit" className="weather-search-btn" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" size={16} /> : "Search"}
          </button>
        </form>

        {/* LOADING STATE */}
        {loading && (
          <div className="weather-loading-wrapper">
            <Loader2 className="animate-spin weather-spinner" size={44} />
            <p>Fetching weather intelligence...</p>
          </div>
        )}

        {/* ERROR STATE */}
        {error && !loading && (
          <div className="weather-error-card">
            <AlertTriangle size={32} />
            <p>{error}</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !weather && !error && (
          <div className="weather-card-glass weather-empty">
            <EmptyState
              title="No weather data loaded"
              message="Search a city to load live weather metrics, forecasts, and Spryzen AI advisory."
            />
          </div>
        )}

        {/* WEATHER CONTENT */}
        {weather && !loading && !error && (
          <div className="weather-grid">
            
            {/* LEFT PANEL: Live Weather Metrics */}
            <div className="weather-col">
              <div className="weather-card-glass">
                <div className="weather-card-header">
                  <MapPin size={18} className="weather-header-icon" />
                  <h2>Live Conditions in {weather.name}</h2>
                </div>

                <div className="weather-metrics-grid">
                  
                  {/* Temperature */}
                  <div className="weather-metric-card-premium">
                    <div className="weather-metric-icon-wrapper temp">
                      <Thermometer size={22} />
                    </div>
                    <div className="weather-metric-details">
                      <span className="weather-metric-title">Temperature</span>
                      <h3 className="weather-metric-value">{Math.round(weather.main.temp)}°C</h3>
                      <span className="weather-metric-helper">Real-time temperature</span>
                    </div>
                  </div>

                  {/* Feels Like */}
                  <div className="weather-metric-card-premium">
                    <div className="weather-metric-icon-wrapper feels-like">
                      <Thermometer size={22} />
                    </div>
                    <div className="weather-metric-details">
                      <span className="weather-metric-title">Feels Like</span>
                      <h3 className="weather-metric-value">{Math.round(weather.main.feels_like)}°C</h3>
                      <span className="weather-metric-helper">Field comfort estimate</span>
                    </div>
                  </div>

                  {/* Humidity */}
                  <div className="weather-metric-card-premium">
                    <div className="weather-metric-icon-wrapper humidity">
                      <Droplet size={22} />
                    </div>
                    <div className="weather-metric-details">
                      <span className="weather-metric-title">Humidity</span>
                      <h3 className="weather-metric-value">{weather.main.humidity}%</h3>
                      <span className="weather-metric-helper">Disease risk indicator</span>
                    </div>
                  </div>

                  {/* Wind Speed */}
                  <div className="weather-metric-card-premium">
                    <div className="weather-metric-icon-wrapper wind">
                      <Wind size={22} />
                    </div>
                    <div className="weather-metric-details">
                      <span className="weather-metric-title">Wind Speed</span>
                      <h3 className="weather-metric-value">{weather.wind.speed} m/s</h3>
                      <span className="weather-metric-helper">Spraying suitability</span>
                    </div>
                  </div>

                  {/* Rain Prediction */}
                  <div className="weather-metric-card-premium">
                    <div className="weather-metric-icon-wrapper rain">
                      <CloudRain size={22} />
                    </div>
                    <div className="weather-metric-details">
                      <span className="weather-metric-title">Rain Prediction</span>
                      <h3 className="weather-metric-value">{rainSlots.length ? "Possible" : "Low"}</h3>
                      <span className="weather-metric-helper">{rainSlots.length} rainy slots in forecast</span>
                    </div>
                  </div>

                  {/* Condition */}
                  <div className="weather-metric-card-premium">
                    <div className="weather-metric-icon-wrapper condition">
                      {getConditionIcon(weather.weather[0].main)}
                    </div>
                    <div className="weather-metric-details">
                      <span className="weather-metric-title">Condition</span>
                      <h3 className="weather-metric-value">{weather.weather[0].main}</h3>
                      <span className="weather-metric-helper">Sky condition status</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* RIGHT PANEL: Spryzen AI Agricultural Guidance */}
            <div className="weather-col">
              <div className="weather-card-glass">
                <div className="weather-chat-header">
                  <div className="weather-chat-avatar">
                    <Sparkles size={20} />
                  </div>
                  <div className="weather-chat-title-wrapper">
                    <p className="weather-chat-name">Spryzen AI Weather Guidance</p>
                    <p className="weather-chat-status">Advisory Live</p>
                  </div>
                </div>

                <div className="weather-chat-bubble">
                  <p className="weather-bubble-intro">
                    I analyzed the current weather parameters and upcoming forecast slots for <strong>{weather.name}</strong>. Here is your location-specific agricultural advisory:
                  </p>

                  {/* Main Advisory Box */}
                  <div className="weather-advisory-box-main" style={{
                    borderLeft: `4px solid ${rainSlots.length ? '#f97316' : '#10b981'}`,
                    background: 'var(--dd-primary-light)',
                    padding: '16px',
                    borderRadius: '0 16px 16px 16px',
                    margin: '16px 0',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: 'var(--dd-text)'
                  }}>
                    {rainSlots.length
                      ? "⚠️ Rain forecast signals indicate moisture accumulation. Fields should be prepped for storm drains and pesticide applications must be deferred."
                      : "✓ Clear and dry weather conditions are forecast. This provides an excellent window for standard field procedures, fertilizing, and scheduled irrigation."
                    }
                  </div>

                  {/* Operations Suitability Checklist */}
                  <div className="weather-checklist-section">
                    <p className="weather-checklist-title">Operational Suitability</p>
                    <div className="weather-checklist-grid">
                      
                      {/* Pesticide Spraying */}
                      <div className="weather-checklist-item">
                        <div className="weather-check-icon">
                          {weather.wind.speed < 5 && rainSlots.length === 0 ? (
                            <CheckCircle2 size={16} style={{ color: "#10b981" }} />
                          ) : (
                            <XCircle size={16} style={{ color: "#ef4444" }} />
                          )}
                        </div>
                        <div className="weather-check-details">
                          <span className="weather-check-label">Pesticide Spraying</span>
                          <span className="weather-check-value">
                            {weather.wind.speed >= 5 
                              ? "Unsuitable (Too windy)" 
                              : rainSlots.length > 0 
                              ? "Unsuitable (Rain expected)" 
                              : "Highly Suitable"
                            }
                          </span>
                        </div>
                      </div>

                      {/* Irrigation Scheduling */}
                      <div className="weather-checklist-item">
                        <div className="weather-check-icon">
                          {rainSlots.length === 0 ? (
                            <CheckCircle2 size={16} style={{ color: "#10b981" }} />
                          ) : (
                            <XCircle size={16} style={{ color: "#ef4444" }} />
                          )}
                        </div>
                        <div className="weather-check-details">
                          <span className="weather-check-label">Irrigation scheduling</span>
                          <span className="weather-check-value">
                            {rainSlots.length > 0 ? "Defer (Rain will irrigate)" : "Highly Suitable"}
                          </span>
                        </div>
                      </div>

                      {/* Disease propagation risk */}
                      <div className="weather-checklist-item">
                        <div className="weather-check-icon">
                          {weather.main.humidity > 75 ? (
                            <AlertTriangle size={16} style={{ color: "#f97316" }} />
                          ) : (
                            <CheckCircle2 size={16} style={{ color: "#10b981" }} />
                          )}
                        </div>
                        <div className="weather-check-details">
                          <span className="weather-check-label">Fungal Disease Risk</span>
                          <span className="weather-check-value" style={{ color: weather.main.humidity > 75 ? "#f97316" : "inherit" }}>
                            {weather.main.humidity > 75 ? "High (High humidity)" : "Low"}
                          </span>
                        </div>
                      </div>

                      {/* Fertilizer application */}
                      <div className="weather-checklist-item">
                        <div className="weather-check-icon">
                          {rainSlots.length === 0 ? (
                            <CheckCircle2 size={16} style={{ color: "#10b981" }} />
                          ) : (
                            <XCircle size={16} style={{ color: "#ef4444" }} />
                          )}
                        </div>
                        <div className="weather-check-details">
                          <span className="weather-check-label">Fertilizer Application</span>
                          <span className="weather-check-value">
                            {rainSlots.length > 0 ? "Defer (Risk of leaching)" : "Suitable"}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Responsive & Premium Custom CSS */}
      <style>{`
        .weather-page-wrapper {
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

        .weather-header-centered {
          text-align: center;
          margin-bottom: 8px;
        }
        .weather-page-title {
          font-size: 32px;
          font-weight: 800;
          color: var(--dd-text);
          margin: 0 0 8px;
          letter-spacing: -0.5px;
        }
        .weather-page-subtitle {
          font-size: 16px;
          color: var(--dd-text-muted);
          margin: 0;
        }

        /* Search Bar styling */
        .weather-search-form {
          display: flex;
          gap: 16px;
          max-width: 600px;
          width: 100%;
          margin: 0 auto 12px;
        }
        .weather-search-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          background: var(--dd-card-bg);
          border: 1px solid var(--dd-border);
          border-radius: 16px;
          padding: 6px 16px;
          gap: 12px;
          box-shadow: var(--dd-shadow);
        }
        .weather-search-icon {
          color: var(--dd-text-muted);
        }
        .weather-search-input {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--dd-text);
          font-size: 15px;
          outline: none;
          padding: 8px 0;
        }
        .weather-search-btn {
          padding: 12px 28px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 700;
          background: var(--dd-primary);
          color: #fff;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(46, 125, 50, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .weather-search-btn:hover {
          background: #246427;
          transform: translateY(-1px);
        }

        /* Weather Grid */
        .weather-grid {
          display: grid;
          grid-template-columns: 1.25fr 1.15fr;
          gap: 32px;
          align-items: start;
        }
        .weather-col {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Glassmorphism Card */
        .weather-card-glass {
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
        .weather-card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }
        .weather-header-icon {
          color: var(--dd-primary);
        }
        .weather-card-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
          color: var(--dd-text);
          letter-spacing: -0.3px;
        }

        /* Metrics grid */
        .weather-metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .weather-metric-card-premium {
          background: rgba(255,255,255,0.02);
          border: 1px solid var(--dd-border);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--dd-shadow);
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        .weather-metric-card-premium:hover {
          transform: translateY(-2px);
          box-shadow: var(--dd-shadow-hover);
        }
        .weather-metric-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .weather-metric-icon-wrapper.temp { background: rgba(239, 68, 68, 0.08); color: #ef4444; }
        .weather-metric-icon-wrapper.feels-like { background: rgba(249, 115, 22, 0.08); color: #f97316; }
        .weather-metric-icon-wrapper.humidity { background: rgba(14, 165, 233, 0.08); color: #0ea5e9; }
        .weather-metric-icon-wrapper.wind { background: rgba(99, 102, 241, 0.08); color: #6366f1; }
        .weather-metric-icon-wrapper.rain { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }
        .weather-metric-icon-wrapper.condition { background: rgba(16, 185, 129, 0.08); color: #10b981; }

        .weather-metric-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .weather-metric-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--dd-text-muted);
        }
        .weather-metric-value {
          font-size: 22px;
          font-weight: 800;
          color: var(--dd-text);
          margin: 0;
          line-height: 1.1;
        }
        .weather-metric-helper {
          font-size: 11px;
          color: var(--dd-text-muted);
          opacity: 0.8;
        }

        /* Loading wrapper */
        .weather-loading-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 60px 20px;
          color: var(--dd-text-muted);
        }
        .weather-spinner {
          color: var(--dd-primary);
        }

        /* Error card */
        .weather-error-card {
          max-width: 600px;
          width: 100%;
          margin: 20px auto;
          padding: 20px;
          border-radius: 16px;
          background: rgba(239, 68, 68, 0.04);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .weather-error-card p {
          margin: 0;
          font-weight: 600;
          font-size: 14px;
        }

        /* Chat advisory styling */
        .weather-chat-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .weather-chat-avatar {
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
        .weather-chat-avatar svg {
          animation: pulse 2s infinite ease-in-out;
        }
        .weather-chat-title-wrapper {
          display: flex;
          flex-direction: column;
        }
        .weather-chat-name {
          font-weight: 800;
          font-size: 16px;
          margin: 0;
          letter-spacing: -0.3px;
          color: var(--dd-text);
        }
        .weather-chat-status {
          font-size: 11px;
          color: var(--dd-primary);
          font-weight: 600;
          margin: 0;
        }
        .weather-chat-bubble {
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--dd-text);
        }
        .weather-bubble-intro {
          margin-top: 0;
          opacity: 0.9;
        }

        /* Suitability checklist styling */
        .weather-checklist-section {
          margin-top: 24px;
        }
        .weather-checklist-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--dd-text-muted);
          margin-bottom: 16px;
          border-bottom: 1px solid var(--dd-border);
          padding-bottom: 8px;
        }
        .weather-checklist-grid {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .weather-checklist-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px;
          border-radius: 12px;
          transition: background 0.2s ease;
        }
        .weather-checklist-item:hover {
          background: rgba(0,0,0,0.01);
        }
        .weather-check-icon {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .weather-check-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .weather-check-label {
          font-size: 13px;
          font-weight: 700;
          color: var(--dd-text);
        }
        .weather-check-value {
          font-size: 12px;
          color: var(--dd-text-muted);
          font-weight: 600;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        /* Responsive Layouts */
        @media (max-width: 1024px) {
          .weather-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        @media (max-width: 768px) {
          .weather-metrics-grid {
            grid-template-columns: 1fr;
          }
          .weather-search-form {
            flex-direction: column;
          }
          .weather-search-btn {
            width: 100%;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default Weather;
