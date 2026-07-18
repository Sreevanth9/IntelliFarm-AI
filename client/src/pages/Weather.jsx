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
  Loader2,
  Clock,
  Compass,
  Sunrise,
  Sunset,
  Calendar
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import EmptyState from "../components/EmptyState/EmptyState";
import { fetchForecast, fetchWeather, fetchWeatherAdvisory } from "../services/weatherApi";
import { fetchDiseaseReports } from "../services/diseaseApi";
import { fetchProfile } from "../services/profileApi";

const Weather = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [advisory, setAdvisory] = useState("");
  const [recentDiagnosis, setRecentDiagnosis] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // null = still resolving, false = no profile location found
  const [locationPrompt, setLocationPrompt] = useState(false);

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

      // Count rain slots in next 24h (8 slots * 3h = 24h)
      const rainCount = f.list?.slice(0, 8).filter(item => 
        item.weather?.[0]?.main?.toLowerCase().includes("rain")
      ).length || 0;

      // Fetch user recent disease context
      let activeCrop = "General Crop";
      try {
        const diagResult = await fetchDiseaseReports();
        if (diagResult.data.success && diagResult.data.reports && diagResult.data.reports.length > 0) {
          const mostRecent = diagResult.data.reports[0];
          setRecentDiagnosis(mostRecent);
          if (mostRecent.crop) {
            activeCrop = mostRecent.crop;
          }
        }
      } catch (diagErr) {
        console.warn("Could not load recent disease reports context:", diagErr.message);
      }

      // Fetch Spryzen AI advisory
      try {
        const advResult = await fetchWeatherAdvisory({
          temp: Math.round(w.main.temp),
          humidity: w.main.humidity,
          windSpeed: w.wind.speed,
          rainSlotsCount: rainCount,
          cityName: w.name,
          cropName: activeCrop
        });
        if (advResult.data.success) {
          setAdvisory(advResult.data.advisory);
        }
      } catch (advErr) {
        console.warn("Could not fetch Spryzen AI weather advisory:", advErr.message);
      }

    } catch (err) {
      setError(err.response?.data?.message || "Unable to load weather right now.");
      toast.error("Weather fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initWeather = async () => {
      // 1. Try user profile location first
      try {
        const profileRes = await fetchProfile();
        const loc =
          profileRes.data?.profile?.location ||
          profileRes.data?.location ||
          null;
        if (loc && loc.trim()) {
          setCity(loc.trim());
          fetchWeatherForCity(loc.trim());
          return;
        }
      } catch (profileErr) {
        console.warn("Could not read profile location:", profileErr.message);
      }

      // 2. Try cached localStorage location
      const localLocation = localStorage.getItem("location");
      if (localLocation && localLocation.trim()) {
        const cached = localLocation.split(",")[0].trim();
        setCity(cached);
        fetchWeatherForCity(cached);
        return;
      }

      // 3. No location found — show prompt
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

  const rainSlots =
    forecast?.list
      ?.slice(0, 8)
      .filter((item) => item.weather?.[0]?.main?.toLowerCase().includes("rain")) || [];

  const getConditionIcon = (main) => {
    const m = (main || "").toLowerCase();
    if (m.includes("rain")) return <CloudRain size={20} />;
    if (m.includes("thunderstorm")) return <CloudLightning size={20} />;
    if (m.includes("clear") || m.includes("sun")) return <Sun size={20} />;
    if (m.includes("cloud")) return <CloudSun size={20} />;
    return <Cloud size={20} />;
  };

  const getWindDirection = (deg) => {
    if (deg === undefined) return "N/A";
    const val = Math.floor((deg / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const getWeeklyForecast = () => {
    if (!forecast?.list) return [];
    const days = {};
    forecast.list.forEach((slot) => {
      const dateStr = new Date(slot.dt * 1000).toDateString();
      if (!days[dateStr]) {
        days[dateStr] = [];
      }
      days[dateStr].push(slot);
    });
    return Object.keys(days).slice(1, 6).map((dayStr) => {
      const slots = days[dayStr];
      const middaySlot = slots.find(s => new Date(s.dt * 1000).getHours() === 12) || slots[Math.floor(slots.length / 2)];
      const minTemp = Math.min(...slots.map(s => s.main.temp_min));
      const maxTemp = Math.max(...slots.map(s => s.main.temp_max));
      return {
        dateStr: dayStr,
        dayName: new Date(middaySlot.dt * 1000).toLocaleDateString("en-US", { weekday: "short" }),
        tempMin: Math.round(minTemp),
        tempMax: Math.round(maxTemp),
        pop: Math.round(middaySlot.pop * 100),
        condition: middaySlot.weather[0].main
      };
    });
  };

  const getDiseaseWeatherAnalysis = (diseaseName, temp, humidity) => {
    const d = (diseaseName || "").toLowerCase();
    let risk = "Medium";
    let reason = "Moderate humidity and temperature conditions.";
    let recommendation = "Monitor the crop weekly for leaf spots or lesions.";

    const isHighHumidity = humidity > 80;
    const isModerateTemp = temp >= 15 && temp <= 25;
    const isWarmTemp = temp > 25 && temp <= 32;

    if (d.includes("late blight")) {
      if (isHighHumidity && isModerateTemp) {
        risk = "Very High";
        reason = "High humidity (>80%) and moderate temperatures (15-25°C) are the optimal breeding ground for Phytophthora infestans (Late Blight).";
        recommendation = "Apply preventative bio-fungicide or copper-based fungicide within 24 hours. Improve ventilation and prune bottom leaves.";
      } else if (isHighHumidity || isModerateTemp) {
        risk = "High";
        reason = "Humid air or moderate temperature is creating conducive conditions for Late Blight development.";
        recommendation = "Keep foliage dry, inspect plants daily, and avoid overhead watering.";
      } else {
        risk = "Low";
        reason = "Current weather conditions are dry or extreme enough to slow down Late Blight spread.";
        recommendation = "Continue normal maintenance. Clean tools before moving to healthy plots.";
      }
    } else if (d.includes("early blight")) {
      if (isHighHumidity && isWarmTemp) {
        risk = "Very High";
        reason = "High humidity (>75%) and warm temperatures (24-32°C) cause rapid spore germination of Alternaria solani (Early Blight).";
        recommendation = "Spray organic neem oil or recommended fungicide. Prune infected lower foliage immediately.";
      } else if (isHighHumidity || isWarmTemp) {
        risk = "High";
        reason = "Warm temperature or humidity is raising the risk of Early Blight development.";
        recommendation = "Inspect tomato plants for black concentric rings on lower leaves. Ensure proper plant spacing.";
      } else {
        risk = "Low";
        reason = "Dry conditions limit spore germination and infection cycles.";
        recommendation = "Maintain proper soil nutrient levels to strengthen plant resistance.";
      }
    } else if (d.includes("blast")) {
      if (isHighHumidity && temp >= 20 && temp <= 30) {
        risk = "Very High";
        reason = "Optimal blast development conditions (high humidity >85% and temperature 20-30°C).";
        recommendation = "Avoid excessive nitrogen application. Apply recommended systemic fungicide if lesions appear.";
      } else {
        risk = "Medium";
        reason = "Weather is moderately supportive of blast spore propagation.";
        recommendation = "Monitor rice leaves and collars for diamond-shaped lesions.";
      }
    } else {
      if (isHighHumidity) {
        risk = "High";
        reason = "High humidity (>80%) generally favors most bacterial and fungal pathogens.";
        recommendation = "Keep crop canopy well-ventilated and avoid wet foliage during early mornings.";
      } else {
        risk = "Low";
        reason = "Dry air is highly unfavorable for most foliar pathogens.";
        recommendation = "Standard prevention measures apply.";
      }
    }

    return { risk, reason, recommendation };
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

        {/* LOCATION PROMPT — shown when no profile/cached location found */}
        {locationPrompt && !loading && !weather && !error && (
          <div className="weather-location-prompt-card">
            <div className="weather-prompt-icon-wrapper">
              <MapPin size={36} />
            </div>
            <h2 className="weather-prompt-title">Where is your farm located?</h2>
            <p className="weather-prompt-subtitle">
              We couldn't find a location in your profile. Enter your city name or
              pincode below to load real-time weather and agricultural insights.
            </p>
            <form className="weather-prompt-form" onSubmit={submitHandler}>
              <div className="weather-prompt-input-wrapper">
                <Search size={17} className="weather-prompt-search-icon" />
                <input
                  autoFocus
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City name or pincode (e.g. 500001, Hyderabad, Delhi)"
                  className="weather-prompt-input"
                />
              </div>
              <button type="submit" className="weather-prompt-btn" disabled={!city.trim()}>
                Load Weather
              </button>
            </form>
            <p className="weather-prompt-hint">
              💡 Tip: Set your farm location in{" "}
              <a href="/profile" className="weather-prompt-link">Profile Settings</a>{" "}
              so weather loads automatically every time.
            </p>
          </div>
        )}

        {/* GENERIC EMPTY STATE (no prompt, no data — should not normally appear) */}
        {!locationPrompt && !loading && !weather && !error && (
          <div className="weather-card-glass weather-empty">
            <EmptyState
              title="No weather data loaded"
              message="Search a city above to load live weather metrics, forecasts, and Spryzen AI advisory."
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
                      <span className="weather-metric-helper">Feels like {Math.round(weather.main.feels_like)}°C</span>
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
                      <span className="weather-metric-helper">Disease propagation factor</span>
                    </div>
                  </div>

                  {/* Wind Speed & Direction */}
                  <div className="weather-metric-card-premium">
                    <div className="weather-metric-icon-wrapper wind">
                      <Wind size={22} />
                    </div>
                    <div className="weather-metric-details">
                      <span className="weather-metric-title">Wind</span>
                      <h3 className="weather-metric-value">{weather.wind.speed} m/s</h3>
                      <span className="weather-metric-helper">Direction: {getWindDirection(weather.wind.deg)} ({weather.wind.deg || 0}°)</span>
                    </div>
                  </div>

                  {/* Cloud Cover */}
                  <div className="weather-metric-card-premium">
                    <div className="weather-metric-icon-wrapper condition">
                      <CloudSun size={22} />
                    </div>
                    <div className="weather-metric-details">
                      <span className="weather-metric-title">Cloud Cover</span>
                      <h3 className="weather-metric-value">{weather.clouds?.all}%</h3>
                      <span className="weather-metric-helper">Condition: {weather.weather[0].main}</span>
                    </div>
                  </div>

                  {/* Visibility */}
                  <div className="weather-metric-card-premium">
                    <div className="weather-metric-icon-wrapper condition" style={{ backgroundColor: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                      <Compass size={22} />
                    </div>
                    <div className="weather-metric-details">
                      <span className="weather-metric-title">Visibility</span>
                      <h3 className="weather-metric-value">{(weather.visibility / 1000).toFixed(1)} km</h3>
                      <span className="weather-metric-helper">Atmospheric clarity</span>
                    </div>
                  </div>

                  {/* Pressure */}
                  <div className="weather-metric-card-premium">
                    <div className="weather-metric-icon-wrapper condition" style={{ backgroundColor: 'rgba(107,114,128,0.08)', color: '#6b7280' }}>
                      <Compass size={22} />
                    </div>
                    <div className="weather-metric-details">
                      <span className="weather-metric-title">Pressure</span>
                      <h3 className="weather-metric-value">{weather.main.pressure} hPa</h3>
                      <span className="weather-metric-helper">Sea-level pressure</span>
                    </div>
                  </div>

                </div>

                {/* Sunrise & Sunset */}
                <div className="weather-sunrise-sunset-bar">
                  <div className="weather-sun-time">
                    <Sunrise size={16} style={{ color: '#ca8a04' }} />
                    <span>Sunrise: {formatTime(weather.sys?.sunrise)}</span>
                  </div>
                  <div className="weather-sun-time">
                    <Sunset size={16} style={{ color: '#6366f1' }} />
                    <span>Sunset: {formatTime(weather.sys?.sunset)}</span>
                  </div>
                </div>

              </div>

              {/* Hourly Timeline decision support */}
              {forecast?.list && (
                <div className="weather-card-glass">
                  <div className="weather-card-header">
                    <Clock size={18} className="weather-header-icon" />
                    <h2>Hourly Farm Decision Timeline (Next 24h)</h2>
                  </div>
                  <div className="weather-hourly-timeline">
                    {forecast.list.slice(0, 8).map((slot, i) => {
                      const timeStr = new Date(slot.dt * 1000).toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit', hour12: true });
                      const popPerc = Math.round(slot.pop * 100);
                      const isRain = slot.weather[0].main.toLowerCase().includes("rain");
                      const isWindy = slot.wind.speed > 5;
                      let sprayStatus = "✅ Good";
                      let sprayColor = "#10b981";
                      if (isRain) {
                        sprayStatus = "❌ Rain";
                        sprayColor = "#ef4444";
                      } else if (isWindy) {
                        sprayStatus = "⚠️ Windy";
                        sprayColor = "#f59e0b";
                      }
                      return (
                        <div key={i} className="weather-hourly-item">
                          <span className="weather-hourly-time">{timeStr}</span>
                          <span className="weather-hourly-icon">{getConditionIcon(slot.weather[0].main)}</span>
                          <span className="weather-hourly-temp">{Math.round(slot.main.temp)}°C</span>
                          <span className="weather-hourly-pop" style={{ color: popPerc > 30 ? "#3b82f6" : "inherit" }}>
                            💧 {popPerc}% Rain
                          </span>
                          <span className="weather-hourly-spray" style={{ color: sprayColor, fontWeight: '700' }}>
                            {sprayStatus}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Weekly Forecast */}
              <div className="weather-card-glass">
                <div className="weather-card-header">
                  <Calendar size={18} className="weather-header-icon" />
                  <h2>5-Day Weekly Forecast</h2>
                </div>
                <div className="weather-weekly-grid">
                  {getWeeklyForecast().map((day, i) => (
                    <div key={i} className="weather-weekly-item">
                      <span className="weather-weekly-day">{day.dayName}</span>
                      <span className="weather-weekly-icon">{getConditionIcon(day.condition)}</span>
                      <span className="weather-weekly-condition">{day.condition}</span>
                      <span className="weather-weekly-temps">
                        <span className="temp-max">{day.tempMax}°</span>
                        <span className="temp-min">{day.tempMin}°</span>
                      </span>
                      <span className="weather-weekly-pop">💧 {day.pop}%</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT PANEL: Spryzen AI Guidance */}
            <div className="weather-col">
              
              {/* Spryzen AI Farm Summary */}
              <div className="weather-card-glass">
                <div className="weather-chat-header">
                  <div className="weather-chat-avatar">
                    <Sparkles size={20} />
                  </div>
                  <div className="weather-chat-title-wrapper">
                    <p className="weather-chat-name">Spryzen AI Farm Summary</p>
                    <p className="weather-chat-status">Advisory Live</p>
                  </div>
                </div>

                <div className="weather-chat-bubble">
                  {advisory ? (
                    <p style={{ margin: 0, fontSize: '14.5px', lineHeight: 1.65 }}>{advisory}</p>
                  ) : (
                    <p style={{ margin: 0, fontSize: '14.5px', lineHeight: 1.65 }}>
                      Evaluating conditions... High humidity might raise fungal risk. Avoid chemical spraying if winds are gusty, and coordinate soil irrigation relative to the 24h precipitation forecasts.
                    </p>
                  )}
                </div>
              </div>

              {/* Pathological Disease Weather Context Integration */}
              {recentDiagnosis && (
                <div className="weather-card-glass pathological-risk-card" style={{
                  borderTop: '4px solid #ef4444'
                }}>
                  <div className="weather-card-header">
                    <AlertTriangle size={18} className="weather-header-icon" style={{ color: '#ef4444' }} />
                    <h2>Pathological Disease Propagation Risk</h2>
                  </div>
                  <div className="weather-disease-advisory">
                    <div className="weather-disease-header-row">
                      <p className="weather-disease-title">Active Disease Context:</p>
                      <span className="weather-disease-name">{recentDiagnosis.diseaseName}</span>
                    </div>
                    
                    {(() => {
                      const analysis = getDiseaseWeatherAnalysis(
                        recentDiagnosis.diseaseName,
                        weather.main.temp,
                        weather.main.humidity
                      );
                      return (
                        <>
                          <div className="weather-disease-risk-badge-wrapper">
                            <span className="weather-disease-risk-label">Weather Risk Factor:</span>
                            <span className="weather-disease-risk-value" style={{
                              color: analysis.risk.includes("Very High") || analysis.risk.includes("High") ? "#ef4444" : "#10b981",
                              fontWeight: "800",
                              fontSize: "16px"
                            }}>
                              {analysis.risk}
                            </span>
                          </div>
                          
                          <div className="weather-disease-reason-box">
                            <p className="weather-disease-sub-title">Pathogen Behavior:</p>
                            <p style={{ margin: 0 }}>{analysis.reason}</p>
                          </div>

                          <div className="weather-disease-recommendation-box">
                            <p className="weather-disease-sub-title">Agro-action Recommendation:</p>
                            <p style={{ margin: 0 }}>{analysis.recommendation}</p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Best Operational Windows Card */}
              <div className="weather-card-glass">
                <div className="weather-card-header">
                  <CheckCircle2 size={18} className="weather-header-icon" />
                  <h2>Best Operations Window (Next 24h)</h2>
                </div>
                
                <div className="weather-checklist-grid">
                  
                  {/* Spraying window */}
                  <div className="weather-checklist-item-modern">
                    <span className="checklist-item-title">Pesticide Spray Window</span>
                    <span className="checklist-item-val" style={{
                      color: weather.wind.speed < 4.5 && rainSlots.length === 0 ? "#10b981" : "#f97316"
                    }}>
                      {weather.wind.speed < 4.5 && rainSlots.length === 0 
                        ? "Optimal Spray Window (Mild Winds & Dry Skies)" 
                        : "Sub-optimal Spray Window (Risk of Drift/Washout)"}
                    </span>
                  </div>

                  {/* Irrigation window */}
                  <div className="weather-checklist-item-modern">
                    <span className="checklist-item-title">Irrigation Recommendation</span>
                    <span className="checklist-item-val" style={{
                      color: rainSlots.length === 0 ? "#10b981" : "#ef4444"
                    }}>
                      {rainSlots.length > 0 
                        ? "Defer Irrigation (Natural rainfall expected)" 
                        : "Suitable Window (Administer scheduled watering)"}
                    </span>
                  </div>

                  {/* Harvest window */}
                  <div className="weather-checklist-item-modern">
                    <span className="checklist-item-title">Harvest Window</span>
                    <span className="checklist-item-val" style={{
                      color: rainSlots.length === 0 ? "#10b981" : "#ef4444"
                    }}>
                      {rainSlots.length === 0 
                        ? "Optimal Window (Dry foliage prevents mold)" 
                        : "Risky Window (Damp conditions, mold hazard)"}
                    </span>
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

        /* Sunrise & Sunset bar */
        .weather-sunrise-sunset-bar {
          display: flex;
          justify-content: space-between;
          padding: 12px 18px;
          border-radius: 14px;
          background: rgba(0,0,0,0.02);
          border: 1px solid var(--dd-border);
          margin-top: 20px;
        }
        .weather-sun-time {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: var(--dd-text);
        }

        /* Hourly Decision timeline */
        .weather-hourly-timeline {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .weather-hourly-item {
          display: grid;
          grid-template-columns: 1.4fr 0.6fr 0.8fr 1.2fr 1.2fr;
          align-items: center;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(0,0,0,0.01);
          border: 1px solid var(--dd-border);
          font-size: 13.5px;
        }
        .weather-hourly-time {
          font-weight: 700;
          color: var(--dd-text);
        }
        .weather-hourly-temp {
          font-weight: 800;
          color: var(--dd-text);
        }
        .weather-hourly-pop {
          font-weight: 700;
          color: #3b82f6;
        }

        /* Weekly Forecast */
        .weather-weekly-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .weather-weekly-item {
          display: grid;
          grid-template-columns: 1.4fr 0.6fr 1.4fr 1.2fr 1fr;
          align-items: center;
          padding: 12px 16px;
          border-radius: 14px;
          background: rgba(0,0,0,0.01);
          border: 1px solid var(--dd-border);
          font-size: 13.5px;
        }
        .weather-weekly-day {
          font-weight: 700;
          color: var(--dd-text);
        }
        .weather-weekly-condition {
          font-weight: 600;
          color: var(--dd-text-muted);
        }
        .weather-weekly-temps {
          display: flex;
          gap: 8px;
          font-weight: 800;
        }
        .temp-max { color: var(--dd-text); }
        .temp-min { color: var(--dd-text-muted); opacity: 0.6; }
        .weather-weekly-pop {
          font-weight: 700;
          color: #3b82f6;
          text-align: right;
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

        /* Location Prompt Card */
        .weather-location-prompt-card {
          max-width: 560px;
          width: 100%;
          margin: 0 auto;
          padding: 52px 44px;
          border-radius: 28px;
          background: var(--dd-card-bg);
          border: 1px solid var(--dd-border);
          box-shadow: var(--dd-shadow-hover);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 20px;
        }
        .weather-prompt-icon-wrapper {
          width: 72px;
          height: 72px;
          border-radius: 22px;
          background: var(--dd-primary-light);
          color: var(--dd-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(46,125,50,0.12);
        }
        .weather-prompt-title {
          font-size: 24px;
          font-weight: 800;
          margin: 0;
          color: var(--dd-text);
          letter-spacing: -0.4px;
        }
        .weather-prompt-subtitle {
          font-size: 14.5px;
          color: var(--dd-text-muted);
          margin: 0;
          line-height: 1.6;
          max-width: 400px;
        }
        .weather-prompt-form {
          display: flex;
          gap: 12px;
          width: 100%;
        }
        .weather-prompt-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          background: rgba(0,0,0,0.02);
          border: 1.5px solid var(--dd-border);
          border-radius: 16px;
          padding: 4px 16px;
          gap: 10px;
          transition: border-color 0.2s ease;
        }
        .weather-prompt-input-wrapper:focus-within {
          border-color: var(--dd-primary);
          box-shadow: 0 0 0 3px rgba(46,125,50,0.08);
        }
        .weather-prompt-search-icon {
          color: var(--dd-text-muted);
          flex-shrink: 0;
        }
        .weather-prompt-input {
          flex: 1;
          border: none;
          background: transparent;
          color: var(--dd-text);
          font-size: 14.5px;
          outline: none;
          padding: 12px 0;
        }
        .weather-prompt-btn {
          padding: 12px 24px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 700;
          background: var(--dd-primary);
          color: #fff;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .weather-prompt-btn:hover:not(:disabled) {
          background: #246427;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(46,125,50,0.25);
        }
        .weather-prompt-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .weather-prompt-hint {
          font-size: 13px;
          color: var(--dd-text-muted);
          margin: 4px 0 0;
          line-height: 1.5;
        }
        .weather-prompt-link {
          color: var(--dd-primary);
          font-weight: 700;
          text-decoration: none;
        }
        .weather-prompt-link:hover {
          text-decoration: underline;
        }
        @media (max-width: 600px) {
          .weather-location-prompt-card {
            padding: 36px 24px;
          }
          .weather-prompt-form {
            flex-direction: column;
          }
          .weather-prompt-btn {
            width: 100%;
          }
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

        /* Pathological advisory integration styling */
        .weather-disease-advisory {
          display: flex;
          flex-direction: column;
          gap: 14px;
          font-size: 14px;
        }
        .weather-disease-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .weather-disease-title {
          font-weight: 700;
          margin: 0;
          color: var(--dd-text);
        }
        .weather-disease-name {
          font-weight: 850;
          background: rgba(239, 68, 68, 0.08);
          color: #ef4444;
          padding: 4px 12px;
          border-radius: 10px;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }
        .weather-disease-risk-badge-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--dd-border);
        }
        .weather-disease-risk-label {
          font-weight: 700;
          color: var(--dd-text);
        }
        .weather-disease-sub-title {
          margin: 0 0 6px;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 11px;
          color: var(--dd-text-muted);
          letter-spacing: 0.5px;
        }
        .weather-disease-reason-box, .weather-disease-recommendation-box {
          padding: 14px 18px;
          border-radius: 16px;
          background: rgba(0,0,0,0.02);
          border: 1px solid var(--dd-border);
          line-height: 1.55;
          color: var(--dd-text);
        }

        /* Operations suitability checklists */
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
          font-size: 13.5px;
          font-weight: 700;
          color: var(--dd-text);
        }
        .weather-check-value {
          font-size: 12.5px;
          color: var(--dd-text-muted);
          font-weight: 600;
        }

        .weather-checklist-item-modern {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 14px 18px;
          border-radius: 16px;
          background: rgba(0,0,0,0.02);
          border: 1px solid var(--dd-border);
          box-shadow: var(--dd-shadow);
        }
        .checklist-item-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--dd-text-muted);
        }
        .checklist-item-val {
          font-size: 14px;
          font-weight: 800;
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
          .weather-hourly-item, .weather-weekly-item {
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
          }
          .weather-weekly-pop, .weather-hourly-spray {
            text-align: left;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default Weather;
