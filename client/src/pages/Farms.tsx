import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Leaf, Calendar, Trash2, CloudSun,
  Microscope, Sprout, Waves, ChevronDown, ChevronUp,
  Plus, BarChart3, AlertCircle, Edit2
} from "lucide-react";

import EmptyState from "../components/EmptyState/EmptyState";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { addFarm, fetchFarms, deleteFarm, FarmPayload } from "../services/farmApi";
import { Farm } from "../types";

// ─── Static data ───────────────────────────────────────────────────────────────

const CROPS = ["Paddy", "Wheat", "Maize", "Tomato", "Cotton", "Groundnut", "Sugarcane", "Potato", "Chilli", "Soybean", "Onion", "Sunflower"];
const SOIL_TYPES = ["Loamy", "Clayey", "Black Cotton", "Sandy", "Alluvial", "Red Sandy"];
const IRRIGATION_METHODS = ["Drip", "Sprinkler", "Flood", "Furrow", "Rain-fed", "Manual"];

const SOIL_INTEL: Record<string, { desc: string; color: string }> = {
  Loamy:         { desc: "Excellent drainage & nutrient retention. Ideal for most crops. Water every 2–3 days.", color: "#92400e" },
  Clayey:        { desc: "High water retention. Reduce irrigation frequency. Aerate soil regularly.", color: "#6b7280" },
  "Black Cotton": { desc: "Deep, moisture-retentive. Ideal for cotton & soybean. Avoid waterlogging.", color: "#1f2937" },
  Sandy:         { desc: "Low retention, drains fast. Water daily. Add organic compost for nutrients.", color: "#d97706" },
  Alluvial:      { desc: "Rich in nutrients. Best for wheat & rice. High fertility — minimal fertilizing.", color: "#78716c" },
  "Red Sandy":   { desc: "Low fertility & acidic. Apply lime + organic compost. Needs frequent watering.", color: "#b45309" },
};

const GROWTH_STAGE_CONFIG = [
  { key: "Germination",    days: [0, 20],   color: "#10b981", icon: "🌱" },
  { key: "Vegetative",     days: [21, 45],  color: "#3b82f6", icon: "🌿" },
  { key: "Flowering",      days: [46, 70],  color: "#f59e0b", icon: "🌸" },
  { key: "Fruiting",       days: [71, 90],  color: "#ef4444", icon: "🍅" },
  { key: "Harvest Ready",  days: [91, 999], color: "#8b5cf6", icon: "🌾" },
];

const getStageConfig = (stage: string) =>
  GROWTH_STAGE_CONFIG.find((s) => s.key === stage) || GROWTH_STAGE_CONFIG[0];

const getDaysToHarvest = (expectedHarvest?: string): number | null => {
  if (!expectedHarvest) return null;
  const diff = new Date(expectedHarvest).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const Farms: React.FC = () => {
  const isLogin = useSelector((state: any) => state.auth.isLogin);
  const { farmer } = useAuth() as any;
  const navigate = useNavigate();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expandedFarm, setExpandedFarm] = useState<string | null>(null);

  const profileLocation = farmer?.location || farmer?.profile_location || "";
  const locationInputRef = React.useRef<HTMLInputElement | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState(profileLocation);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [crop, setCrop] = useState("Tomato");
  const [cropVariety, setCropVariety] = useState("");
  const [soilType, setSoilType] = useState("Loamy");
  const [area, setArea] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [expectedHarvest, setExpectedHarvest] = useState("");
  const [irrigationMethod, setIrrigationMethod] = useState("Drip");
  const [notes, setNotes] = useState("");

  const loadFarms = useCallback(() => {
    if (!isLogin) return;
    setFetching(true);
    fetchFarms()
      .then(({ data }) => {
        if (data.success && data.farms) setFarms(data.farms);
      })
      .catch((err: any) => console.error("Failed to load farms", err))
      .finally(() => setFetching(false));
  }, [isLogin]);

  useEffect(() => { loadFarms(); }, [loadFarms]);

  // Sync profile location as default when opening form
  useEffect(() => {
    if (showForm && !location && profileLocation) {
      setLocation(profileLocation);
    }
  }, [showForm, profileLocation]);

  const resetForm = () => {
    setName(""); setLocation(profileLocation); setLatitude(null); setLongitude(null);
    setCrop("Tomato"); setCropVariety(""); setSoilType("Loamy"); setArea("");
    setSowingDate(""); setExpectedHarvest(""); setIrrigationMethod("Drip"); setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !crop || !soilType || !area || !sowingDate) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const payload: FarmPayload = {
        name, location, latitude, longitude,
        crop, cropVariety, soilType, area, sowingDate,
        expectedHarvest: expectedHarvest || undefined,
        irrigationMethod, notes: notes || undefined,
      };
      const { data } = await addFarm(payload);
      if (data.success && data.farm) {
        setFarms((prev) => [data.farm, ...prev]);
        toast.success("Farm registered successfully!");
        resetForm();
        setShowForm(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create farm.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this farm?")) return;
    try {
      const { data } = await deleteFarm(id);
      if (data.success) {
        setFarms((prev) => prev.filter((f) => f.id !== id));
        toast.success("Farm deleted.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete farm.");
    }
  };

  if (!isLogin) {
    return (
      <MainLayout eyebrow="Farm Ecosystem" title="My Farms" subtitle="">
        <EmptyState title="Authentication Required" message="Please log in to manage your farms." />
      </MainLayout>
    );
  }

  const totalScans = 0; // placeholder until we join disease_reports

  return (
    <MainLayout eyebrow="" title="" subtitle="">
      <div className="farms-page">

        {/* ── Page Header ── */}
        <div className="farms-page-header">
          <div>
            <h1 className="farms-page-title">My Farms</h1>
            <p className="farms-page-subtitle">Your digital farm profiles — the heart of IntelliFarm AI</p>
          </div>
          <button
            className={showForm ? "farms-cancel-header-btn" : "farms-add-btn"}
            onClick={() => {
              if (showForm) {
                resetForm();
                setShowForm(false);
              } else {
                if (!location && profileLocation) setLocation(profileLocation);
                setShowForm(true);
              }
            }}
            type="button"
          >
            {!showForm && <Plus size={18} />}
            {showForm ? "Cancel" : "Register Farm"}
          </button>
        </div>

        {/* ── Stats Bar ── */}
        {farms.length > 0 && (
          <div className="farms-stats-bar">
            <div className="farms-stat-item">
              <BarChart3 size={18} className="farms-stat-icon" />
              <span className="farms-stat-label">Total Farms</span>
              <strong className="farms-stat-value">{farms.length}</strong>
            </div>
            <div className="farms-stat-divider" />
            <div className="farms-stat-item">
              <Leaf size={18} className="farms-stat-icon" />
              <span className="farms-stat-label">Active Crops</span>
              <strong className="farms-stat-value">{Array.from(new Set(farms.map((f: any) => f.crop))).join(", ") || "—"}</strong>
            </div>
            <div className="farms-stat-divider" />
            <div className="farms-stat-item">
              <Sprout size={18} className="farms-stat-icon" />
              <span className="farms-stat-label">Total Area</span>
              <strong className="farms-stat-value">{farms.map(f => parseFloat(f.area) || 0).reduce((a, b) => a + b, 0).toFixed(1)} acres</strong>
            </div>
            <div className="farms-stat-divider" />
            <div className="farms-stat-item">
              <AlertCircle size={18} className="farms-stat-icon" />
              <span className="farms-stat-label">Disease Scans</span>
              <strong className="farms-stat-value">{totalScans}</strong>
            </div>
          </div>
        )}

        {/* ── Add Farm Form ── */}
        {showForm && (
          <div className="farms-form-card">
            <h2 className="farms-form-title">
              <Sprout size={20} />
              Register New Farm
            </h2>
            <form onSubmit={handleSubmit} className="farms-form-grid">

              {/* Row 1: Name + Location */}
              <div className="farms-form-group farms-span-2">
                <label className="farms-form-label">Farm Name *</label>
                <input className="farms-form-input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. North Valley Field" required />
              </div>

              <div className="farms-form-group">
                <label className="farms-form-label">Location / Address</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    ref={locationInputRef}
                    className="farms-form-input"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="City, village, or farm address"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="farms-edit-loc-btn"
                    onClick={() => {
                      if (locationInputRef.current) {
                        locationInputRef.current.focus();
                        locationInputRef.current.select();
                      }
                    }}
                    title="Edit location"
                  >
                    <Edit2 size={15} /> Edit
                  </button>
                </div>
              </div>

              <div className="farms-form-group">
                <label className="farms-form-label">Area *</label>
                <input className="farms-form-input" value={area} onChange={e => setArea(e.target.value)} placeholder="e.g. 4.5 acres" required />
              </div>

              {/* Row 2: Crop + Variety */}
              <div className="farms-form-group">
                <label className="farms-form-label">Crop Type *</label>
                <select className="farms-form-input farms-form-select" value={crop} onChange={e => setCrop(e.target.value)}>
                  {CROPS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="farms-form-group">
                <label className="farms-form-label">Crop Variety</label>
                <input className="farms-form-input" value={cropVariety} onChange={e => setCropVariety(e.target.value)} placeholder="e.g. Roma VF, Sona Masuri" />
              </div>

              {/* Row 3: Soil + Irrigation */}
              <div className="farms-form-group">
                <label className="farms-form-label">Soil Type *</label>
                <select className="farms-form-input farms-form-select" value={soilType} onChange={e => setSoilType(e.target.value)}>
                  {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="farms-form-group">
                <label className="farms-form-label">Irrigation Method</label>
                <select className="farms-form-input farms-form-select" value={irrigationMethod} onChange={e => setIrrigationMethod(e.target.value)}>
                  {IRRIGATION_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>

              {/* Row 4: Dates */}
              <div className="farms-form-group">
                <label className="farms-form-label">Sowing Date *</label>
                <input className="farms-form-input" type="date" value={sowingDate} onChange={e => setSowingDate(e.target.value)} required />
              </div>

              <div className="farms-form-group">
                <label className="farms-form-label">Expected Harvest Date</label>
                <input className="farms-form-input" type="date" value={expectedHarvest} onChange={e => setExpectedHarvest(e.target.value)} />
              </div>

              {/* Notes */}
              <div className="farms-form-group farms-span-2">
                <label className="farms-form-label">Notes</label>
                <textarea className="farms-form-input" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions, variety details, or field notes..." />
              </div>

              <div className="farms-span-2" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="farms-cancel-btn" onClick={() => { resetForm(); setShowForm(false); }}>Cancel</button>
                <button type="submit" disabled={loading} className="farms-submit-btn">
                  {loading ? "Registering..." : "Register Farm"}
                </button>
              </div>
            </form>

            {/* Live Soil Intel Preview */}
            {soilType && SOIL_INTEL[soilType] && (
              <div className="farms-soil-preview" style={{ borderLeftColor: SOIL_INTEL[soilType].color }}>
                <span style={{ fontWeight: 700 }}>Soil Intel — {soilType}:</span> {SOIL_INTEL[soilType].desc}
              </div>
            )}
          </div>
        )}

        {/* ── Farm Cards ── */}
        {fetching ? (
          <div className="farms-loading">
            <div className="farms-spinner" />
            <p>Loading farm data...</p>
          </div>
        ) : farms.length === 0 ? (
          <div className="farms-empty-state">
            <div className="farms-empty-icon"><Sprout size={48} /></div>
            <h3>No farms registered yet</h3>
            <p>Click "Register Farm" to add your first field and unlock personalized recommendations.</p>
            <button className="farms-add-btn" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Register Your First Farm
            </button>
          </div>
        ) : (
          <div className="farms-cards-grid">
            {farms.map((farm: any) => {
              const stageConfig = getStageConfig(farm.stage || "Germination");
              const daysToHarvest = getDaysToHarvest(farm.expectedHarvest);
              const soilInfo = SOIL_INTEL[farm.soilType] || { desc: "Soil profile not available.", color: "#6b7280" };
              const isExpanded = expandedFarm === farm.id;

              return (
                <article key={farm.id} className="farms-card">

                  {/* Card Header */}
                  <div className="farms-card-header">
                    <div>
                      <h3 className="farms-card-name">{farm.name}</h3>
                      {farm.location && (
                        <span className="farms-card-location"><MapPin size={12} /> {farm.location}</span>
                      )}
                    </div>
                    <button className="farms-delete-btn" onClick={() => handleDelete(farm.id!)} title="Delete farm">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Crop + Area badges */}
                  <div className="farms-card-badges">
                    <span className="farms-badge farms-badge-crop"><Leaf size={12} />{farm.crop}{farm.cropVariety ? ` · ${farm.cropVariety}` : ""}</span>
                    <span className="farms-badge farms-badge-soil">{farm.soilType}</span>
                    <span className="farms-badge farms-badge-area">{farm.area}</span>
                    <span className="farms-badge farms-badge-irr"><Waves size={12} />{farm.irrigationMethod || "Drip"}</span>
                  </div>

                  {/* Growth Stage Progress */}
                  <div className="farms-card-section">
                    <div className="farms-stage-header">
                      <span className="farms-section-label">Growth Stage</span>
                      <span className="farms-stage-badge" style={{ background: stageConfig.color + "18", color: stageConfig.color }}>
                        {stageConfig.icon} {farm.stage || "Germination"}
                      </span>
                    </div>
                    <div className="farms-stage-bar">
                      {GROWTH_STAGE_CONFIG.map((s, i) => (
                        <div
                          key={s.key}
                          className="farms-stage-segment"
                          style={{
                            background: farm.stage === s.key ? s.color : "rgba(0,0,0,0.06)",
                            flex: 1,
                            borderRadius: i === 0 ? "8px 0 0 8px" : i === 4 ? "0 8px 8px 0" : "0",
                          }}
                          title={s.key}
                        />
                      ))}
                    </div>
                    <div className="farms-stage-meta">
                      <span>Day {farm.daysElapsed || 0} since sowing</span>
                      {daysToHarvest !== null && (
                        <span style={{ color: daysToHarvest <= 14 ? "#ef4444" : "inherit" }}>
                          🌾 {daysToHarvest} days to harvest
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Soil Intel */}
                  <div className="farms-soil-intel" style={{ borderLeftColor: soilInfo.color }}>
                    <span className="farms-section-label">Soil Intel</span>
                    <p>{soilInfo.desc}</p>
                  </div>

                  {/* Expand / Collapse additional info */}
                  {farm.notes && (
                    <>
                      <button
                        className="farms-expand-btn"
                        onClick={() => setExpandedFarm(isExpanded ? null : farm.id!)}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? "Hide notes" : "Show notes"}
                      </button>
                      {isExpanded && (
                        <div className="farms-notes-box">
                          <span className="farms-section-label">Notes</span>
                          <p>{farm.notes}</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Dates row */}
                  <div className="farms-card-dates">
                    <span><Calendar size={12} /> Sown: {new Date(farm.sowingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    {farm.expectedHarvest && (
                      <span><Calendar size={12} /> Harvest: {new Date(farm.expectedHarvest).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="farms-card-actions">
                    <button
                      className="farms-action-btn farms-action-weather"
                      onClick={() => navigate(`/weather?city=${encodeURIComponent(farm.location || farm.name)}&farmName=${encodeURIComponent(farm.name)}`)}
                    >
                      <CloudSun size={15} /> Weather
                    </button>
                    <button
                      className="farms-action-btn farms-action-scan"
                      onClick={() => navigate(`/disease-detection?farmId=${farm.id}&crop=${encodeURIComponent(farm.crop)}&farmName=${encodeURIComponent(farm.name)}`)}
                    >
                      <Microscope size={15} /> Scan Disease
                    </button>
                  </div>

                </article>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Scoped CSS ── */}
      <style>{`
        .farms-page {
          --fp: #2e7d32;
          --fp-light: rgba(46,125,50,0.08);
          --fp-card: var(--glass-bg, rgba(255,255,255,0.72));
          --fp-border: var(--glass-border, rgba(46,125,50,0.15));
          --fp-shadow: var(--glass-shadow, 0 8px 32px rgba(46,125,50,0.06));
          --fp-text: var(--body-color, #183d24);
          --fp-muted: #6b7c72;
          --fp-font: 'Outfit','Inter',-apple-system,sans-serif;
          font-family: var(--fp-font);
          max-width: 1300px;
          margin: 0 auto;
          padding: 0 0 60px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* Header */
        .farms-page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
        }
        .farms-page-title {
          font-size: 30px;
          font-weight: 800;
          color: var(--fp-text);
          margin: 0 0 4px;
          letter-spacing: -0.4px;
        }
        .farms-page-subtitle {
          font-size: 14px;
          color: var(--fp-muted);
          margin: 0;
        }
        .farms-add-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 22px;
          background: linear-gradient(135deg, #2e7d32, #1b5e20);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(46,125,50,0.22);
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .farms-add-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(46,125,50,0.3); }

        /* Stats bar */
        .farms-stats-bar {
          display: flex;
          align-items: center;
          gap: 0;
          background: var(--fp-card);
          border: 1px solid var(--fp-border);
          border-radius: 20px;
          box-shadow: var(--fp-shadow);
          padding: 16px 28px;
          backdrop-filter: blur(16px);
          flex-wrap: wrap;
          gap: 16px;
        }
        .farms-stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }
        .farms-stat-icon { color: var(--fp); }
        .farms-stat-label { color: var(--fp-muted); font-weight: 600; }
        .farms-stat-value { color: var(--fp-text); font-weight: 800; font-size: 16px; }
        .farms-stat-divider { width: 1px; height: 28px; background: var(--fp-border); margin: 0 8px; }

        /* Form card */
        .farms-form-card {
          background: var(--fp-card);
          border: 1px solid var(--fp-border);
          border-radius: 24px;
          box-shadow: var(--fp-shadow);
          padding: 32px;
          backdrop-filter: blur(16px);
        }
        .farms-form-title {
          font-size: 20px;
          font-weight: 800;
          color: var(--fp-text);
          margin: 0 0 24px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .farms-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .farms-span-2 { grid-column: 1 / -1; }
        .farms-form-group { display: flex; flex-direction: column; gap: 6px; }
        .farms-form-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--fp-muted); }
        .farms-form-input {
          background: rgba(255,255,255,0.7);
          border: 1.5px solid var(--fp-border);
          border-radius: 13px;
          padding: 11px 14px;
          font-size: 14px;
          color: var(--fp-text);
          outline: none;
          transition: border-color 0.2s;
          font-family: var(--fp-font);
          width: 100%;
          box-sizing: border-box;
        }
        [data-theme="dark"] .farms-form-input { background: rgba(20,32,24,0.7); color: #fff; }
        .farms-form-input:focus { border-color: var(--fp); box-shadow: 0 0 0 3px rgba(46,125,50,0.1); }
        .farms-form-select { cursor: pointer; }
        .farms-cancel-header-btn {
          padding: 10px 18px; border-radius: 14px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #fff; border: none; font-weight: 700; font-size: 14px; cursor: pointer;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.25); transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .farms-cancel-header-btn:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          transform: translateY(-1px);
        }
        .farms-edit-loc-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 11px 16px; border-radius: 13px;
          background: rgba(59, 130, 246, 0.08); color: #3b82f6;
          border: 1.5px solid rgba(59, 130, 246, 0.2);
          font-weight: 700; font-size: 13px; cursor: pointer;
          white-space: nowrap; transition: all 0.2s;
        }
        .farms-edit-loc-btn:hover { background: rgba(59, 130, 246, 0.15); }
        .farms-coords-badge { font-size: 11px; color: var(--fp); font-weight: 600; margin-top: 4px; }
        .farms-soil-preview {
          margin-top: 20px;
          padding: 12px 16px;
          border-left: 4px solid;
          border-radius: 0 12px 12px 0;
          background: rgba(0,0,0,0.02);
          font-size: 13.5px;
          color: var(--fp-text);
          line-height: 1.5;
        }
        .farms-submit-btn {
          padding: 12px 28px; border-radius: 14px; background: linear-gradient(135deg,#2e7d32,#1b5e20);
          color: #fff; border: none; font-weight: 700; font-size: 14px; cursor: pointer;
          box-shadow: 0 4px 14px rgba(46,125,50,0.2); transition: all 0.2s;
        }
        .farms-submit-btn:hover { transform: translateY(-1px); }
        .farms-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .farms-cancel-btn {
          padding: 12px 20px; border-radius: 14px; background: transparent;
          border: 1.5px solid var(--fp-border); color: var(--fp-muted);
          font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.2s;
        }
        .farms-cancel-btn:hover { background: rgba(0,0,0,0.03); }

        /* Loading & empty states */
        .farms-loading { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 20px; color: var(--fp-muted); }
        .farms-spinner { width: 40px; height: 40px; border: 3px solid rgba(46,125,50,0.15); border-top-color: var(--fp); border-radius: 50%; animation: farmspin 0.8s linear infinite; }
        @keyframes farmspin { to { transform: rotate(360deg); } }
        .farms-empty-state {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 12px; padding: 72px 20px;
          background: var(--fp-card); border: 1px dashed var(--fp-border);
          border-radius: 24px;
        }
        .farms-empty-icon { color: var(--fp); opacity: 0.5; }
        .farms-empty-state h3 { margin: 0; font-size: 20px; font-weight: 800; color: var(--fp-text); }
        .farms-empty-state p { margin: 0; color: var(--fp-muted); font-size: 14px; max-width: 360px; }

        /* Farm cards grid */
        .farms-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 24px;
        }
        .farms-card {
          background: var(--fp-card);
          border: 1px solid var(--fp-border);
          border-radius: 24px;
          box-shadow: var(--fp-shadow);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          backdrop-filter: blur(16px);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .farms-card:hover { transform: translateY(-3px); box-shadow: 0 16px 48px rgba(46,125,50,0.12); }

        .farms-card-header {
          display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
        }
        .farms-card-name { font-size: 20px; font-weight: 800; color: var(--fp-text); margin: 0 0 4px; letter-spacing: -0.3px; }
        .farms-card-location { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--fp-muted); font-weight: 600; }
        .farms-delete-btn {
          background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.15);
          color: #ef4444; border-radius: 10px; padding: 8px; cursor: pointer;
          display: flex; align-items: center; transition: all 0.2s; flex-shrink: 0;
        }
        .farms-delete-btn:hover { background: rgba(239,68,68,0.12); }

        /* Badges */
        .farms-card-badges { display: flex; flex-wrap: wrap; gap: 8px; }
        .farms-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 5px 10px; border-radius: 99px; font-size: 12px; font-weight: 700;
        }
        .farms-badge-crop { background: rgba(46,125,50,0.08); color: #2e7d32; }
        .farms-badge-soil { background: rgba(107,114,128,0.08); color: #6b7280; }
        .farms-badge-area { background: rgba(59,130,246,0.08); color: #3b82f6; }
        .farms-badge-irr  { background: rgba(14,165,233,0.08); color: #0ea5e9; }

        /* Growth stage */
        .farms-card-section { display: flex; flex-direction: column; gap: 8px; }
        .farms-stage-header { display: flex; justify-content: space-between; align-items: center; }
        .farms-section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--fp-muted); display: block; margin-bottom: 4px; }
        .farms-stage-badge { font-size: 12px; font-weight: 800; padding: 3px 10px; border-radius: 99px; }
        .farms-stage-bar { display: flex; height: 8px; border-radius: 8px; overflow: hidden; gap: 2px; }
        .farms-stage-segment { height: 100%; transition: background 0.3s ease; }
        .farms-stage-meta { display: flex; justify-content: space-between; font-size: 11.5px; color: var(--fp-muted); font-weight: 600; }

        /* Soil intel */
        .farms-soil-intel {
          padding: 10px 14px;
          border-left: 3px solid;
          border-radius: 0 12px 12px 0;
          background: rgba(0,0,0,0.02);
          font-size: 12.5px;
          line-height: 1.5;
          color: var(--fp-text);
        }
        .farms-soil-intel p { margin: 4px 0 0; color: var(--fp-muted); }

        /* Notes */
        .farms-expand-btn {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          font-size: 12px; color: var(--fp); font-weight: 700; padding: 0;
        }
        .farms-notes-box { padding: 10px 14px; border-radius: 12px; background: rgba(0,0,0,0.02); border: 1px solid var(--fp-border); font-size: 13px; color: var(--fp-muted); line-height: 1.5; }
        .farms-notes-box p { margin: 4px 0 0; }

        /* Dates */
        .farms-card-dates { display: flex; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--fp-muted); font-weight: 600; }
        .farms-card-dates span { display: flex; align-items: center; gap: 4px; }

        /* Action buttons */
        .farms-card-actions { display: flex; gap: 10px; margin-top: 4px; }
        .farms-action-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
          padding: 10px 14px; border-radius: 12px; font-size: 13px; font-weight: 700;
          cursor: pointer; border: none; transition: all 0.2s ease;
        }
        .farms-action-weather { background: rgba(14,165,233,0.08); color: #0ea5e9; border: 1px solid rgba(14,165,233,0.2); }
        .farms-action-weather:hover { background: rgba(14,165,233,0.15); transform: translateY(-1px); }
        .farms-action-scan { background: rgba(139,92,246,0.08); color: #8b5cf6; border: 1px solid rgba(139,92,246,0.2); }
        .farms-action-scan:hover { background: rgba(139,92,246,0.15); transform: translateY(-1px); }

        /* Responsive */
        @media (max-width: 768px) {
          .farms-form-grid { grid-template-columns: 1fr; }
          .farms-span-2 { grid-column: 1; }
          .farms-cards-grid { grid-template-columns: 1fr; }
          .farms-stats-bar { gap: 12px; }
          .farms-stat-divider { display: none; }
        }
      `}</style>
    </MainLayout>
  );
};

export default Farms;
