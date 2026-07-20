import React, { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Leaf, Calendar, Trash2, CloudSun,
  Microscope, Sprout, Waves, ChevronDown, ChevronUp,
  Plus, BarChart3, Edit2, FileText
} from "lucide-react";

import EmptyState from "../components/EmptyState/EmptyState";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { addFarm, fetchFarms, updateFarm, deleteFarm, FarmPayload } from "../services/farmApi";
import { Farm } from "../types";

// ─── Static Data & Crop Varieties Map ────────────────────────────────────────

const CROPS = [
  "Paddy", "Wheat", "Maize", "Tomato", "Cotton",
  "Groundnut", "Sugarcane", "Potato", "Chilli",
  "Soybean", "Onion", "Sunflower"
];

const CROP_VARIETIES: Record<string, string[]> = {
  Tomato: ["Roma VF", "Arka Rakshak", "Pusa Ruby", "Abhinav", "Sona", "Custom / Other"],
  Paddy: ["Sona Masuri", "BPT 5204 (Samba Mahsuri)", "Basmati 370", "IR64", "Swarna", "MTU 1010", "Custom / Other"],
  Wheat: ["HD 2967", "PBW 343", "DBW 187", "GW 322", "Sharbati", "Custom / Other"],
  Maize: ["DHM 117", "HQPM 1", "Pioneer 3396", "Bio 9681", "Custom / Other"],
  Cotton: ["Bt Cotton (RCH 2)", "DCH 32", "Bunny", "Bollgard II", "Custom / Other"],
  Chilli: ["Guntur Sannam (S4)", "Byadgi", "Wonder Hot", "Teja (S17)", "Custom / Other"],
  Sugarcane: ["Co 0238", "Co 86032", "Co 0118", "Custom / Other"],
  Potato: ["Kufri Jyoti", "Kufri Pukhraj", "Kufri Lauvkar", "Custom / Other"],
  Groundnut: ["K6 (Kadiri 6)", "TG 37A", "JL 24", "Custom / Other"],
  Soybean: ["JS 335", "JS 95-60", "NRC 37", "Custom / Other"],
  Onion: ["N-53", "Bhima Super", "Agrifound Dark Red", "Custom / Other"],
  Sunflower: ["KBSH 44", "DRSH 1", "Sunbred", "Custom / Other"],
};

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
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);
  const [expandedFarm, setExpandedFarm] = useState<string | null>(null);
  const [logModalFarm, setLogModalFarm] = useState<Farm | null>(null);
  const [newEventText, setNewEventText] = useState("");

  const profileLocation = farmer?.location || farmer?.profile_location || "";
  const locationInputRef = useRef<HTMLInputElement | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState(profileLocation);
  const [areaValue, setAreaValue] = useState("4.5");
  const [crop, setCrop] = useState("Tomato");
  const [cropVariety, setCropVariety] = useState("Roma VF");
  const [customVariety, setCustomVariety] = useState("");
  const [soilType, setSoilType] = useState("Loamy");
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

  // Sync default profile location
  useEffect(() => {
    if (showForm && !editingFarmId && profileLocation) {
      setLocation(prev => prev || profileLocation);
    }
  }, [showForm, editingFarmId, profileLocation]);

  // Update variety selection when crop changes
  const handleCropChange = (selectedCrop: string) => {
    setCrop(selectedCrop);
    const varieties = CROP_VARIETIES[selectedCrop] || ["Custom / Other"];
    setCropVariety(varieties[0]);
    setCustomVariety("");
  };

  const resetForm = () => {
    setEditingFarmId(null);
    setName("");
    setLocation(profileLocation);
    setAreaValue("4.5");
    setCrop("Tomato");
    setCropVariety("Roma VF");
    setCustomVariety("");
    setSoilType("Loamy");
    setSowingDate("");
    setExpectedHarvest("");
    setIrrigationMethod("Drip");
    setNotes("");
  };

  const handleStartEdit = (farm: any) => {
    setEditingFarmId(farm.id);
    setName(farm.name || "");
    setLocation(farm.location || profileLocation);

    // Extract numeric area if stored as "4.5 acres"
    const rawArea = farm.area || "4.5";
    const numMatch = String(rawArea).match(/[\d.]+/);
    setAreaValue(numMatch ? numMatch[0] : "4.5");

    setCrop(farm.crop || "Tomato");
    
    // Variety check
    const currentCropVarieties = CROP_VARIETIES[farm.crop] || [];
    if (farm.cropVariety && currentCropVarieties.includes(farm.cropVariety)) {
      setCropVariety(farm.cropVariety);
      setCustomVariety("");
    } else if (farm.cropVariety) {
      setCropVariety("Custom / Other");
      setCustomVariety(farm.cropVariety);
    } else {
      setCropVariety(currentCropVarieties[0] || "Custom / Other");
      setCustomVariety("");
    }

    setSoilType(farm.soilType || "Loamy");
    
    // Format date string to YYYY-MM-DD for date input
    if (farm.sowingDate) {
      setSowingDate(new Date(farm.sowingDate).toISOString().split("T")[0]);
    } else {
      setSowingDate("");
    }
    if (farm.expectedHarvest) {
      setExpectedHarvest(new Date(farm.expectedHarvest).toISOString().split("T")[0]);
    } else {
      setExpectedHarvest("");
    }

    setIrrigationMethod(farm.irrigationMethod || "Drip");
    setNotes(farm.notes || "");
    setShowForm(true);
    window.scrollTo({ top: 180, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !crop || !soilType || !sowingDate) {
      toast.error("Please fill in all mandatory fields (*)");
      return;
    }

    const finalVariety = cropVariety === "Custom / Other" ? customVariety.trim() : cropVariety;
    const finalArea = areaValue ? `${areaValue} acres` : "1.0 acres";

    setLoading(true);
    try {
      const payload: FarmPayload = {
        name,
        location: location || undefined,
        crop,
        cropVariety: finalVariety || undefined,
        soilType,
        area: finalArea,
        sowingDate,
        expectedHarvest: expectedHarvest || undefined,
        irrigationMethod: irrigationMethod || undefined,
        notes: notes || undefined,
      };

      if (editingFarmId) {
        const { data } = await updateFarm(editingFarmId, payload);
        if (data.success && data.farm) {
          setFarms((prev) => prev.map((f) => (f.id === editingFarmId ? data.farm : f)));
          toast.success("Farm updated successfully!");
          resetForm();
          setShowForm(false);
        }
      } else {
        const { data } = await addFarm(payload);
        if (data.success && data.farm) {
          setFarms((prev) => [data.farm, ...prev]);
          toast.success("Farm registered successfully!");
          resetForm();
          setShowForm(false);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save farm.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddLogEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logModalFarm || !newEventText.trim()) return;

    const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const logEntry = `[${dateStr}] ${newEventText.trim()}`;
    const updatedNotes = logModalFarm.notes ? `${logModalFarm.notes}\n${logEntry}` : logEntry;

    try {
      const { data } = await updateFarm(logModalFarm.id!, { notes: updatedNotes });
      if (data.success && data.farm) {
        setFarms((prev) => prev.map((f) => (f.id === logModalFarm.id ? data.farm : f)));
        toast.success("Log entry added!");
        setLogModalFarm(null);
        setNewEventText("");
      }
    } catch (err: any) {
      toast.error("Failed to add log entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this farm profile?")) return;
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

  const availableVarieties = CROP_VARIETIES[crop] || ["Custom / Other"];

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
          </div>
        )}

        {/* ── Add / Edit Farm Form ── */}
        {showForm && (
          <div className="farms-form-card">
            <h2 className="farms-form-title">
              <Sprout size={20} />
              {editingFarmId ? "Update Farm Profile" : "Register New Farm"}
            </h2>
            <form onSubmit={handleSubmit} className="farms-form-grid">

              {/* Row 1: Name + Location */}
              <div className="farms-form-group farms-span-2">
                <label className="farms-form-label">
                  Farm Name <span className="farms-req-star">*</span>
                </label>
                <input
                  className="farms-form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. North Valley Field"
                  required
                />
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

              {/* Area in Acres */}
              <div className="farms-form-group">
                <label className="farms-form-label">Area (in Acres)</label>
                <div className="farms-area-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className="farms-form-input"
                    value={areaValue}
                    onChange={e => setAreaValue(e.target.value)}
                    placeholder="e.g. 4.5"
                  />
                  <span className="farms-area-unit-badge">Acres</span>
                </div>
              </div>

              {/* Row 2: Crop + Variety */}
              <div className="farms-form-group">
                <label className="farms-form-label">
                  Crop Type <span className="farms-req-star">*</span>
                </label>
                <select
                  className="farms-form-input farms-form-select"
                  value={crop}
                  onChange={e => handleCropChange(e.target.value)}
                  required
                >
                  {CROPS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="farms-form-group">
                <label className="farms-form-label">Crop Variety</label>
                <select
                  className="farms-form-input farms-form-select"
                  value={cropVariety}
                  onChange={e => setCropVariety(e.target.value)}
                >
                  {availableVarieties.map(v => <option key={v}>{v}</option>)}
                </select>

                {cropVariety === "Custom / Other" && (
                  <input
                    className="farms-form-input"
                    style={{ marginTop: "6px" }}
                    value={customVariety}
                    onChange={e => setCustomVariety(e.target.value)}
                    placeholder="Type custom crop variety name"
                  />
                )}
              </div>

              {/* Row 3: Soil + Irrigation */}
              <div className="farms-form-group">
                <label className="farms-form-label">
                  Soil Type <span className="farms-req-star">*</span>
                </label>
                <select
                  className="farms-form-input farms-form-select"
                  value={soilType}
                  onChange={e => setSoilType(e.target.value)}
                  required
                >
                  {SOIL_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="farms-form-group">
                <label className="farms-form-label">Irrigation Method</label>
                <select
                  className="farms-form-input farms-form-select"
                  value={irrigationMethod}
                  onChange={e => setIrrigationMethod(e.target.value)}
                >
                  {IRRIGATION_METHODS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>

              {/* Row 4: Dates */}
              <div className="farms-form-group">
                <label className="farms-form-label">
                  Sowing Date <span className="farms-req-star">*</span>
                </label>
                <input
                  className="farms-form-date-input"
                  type="date"
                  value={sowingDate}
                  onChange={e => setSowingDate(e.target.value)}
                  required
                />
              </div>

              <div className="farms-form-group">
                <label className="farms-form-label">Expected Harvest Date</label>
                <input
                  className="farms-form-date-input"
                  type="date"
                  value={expectedHarvest}
                  onChange={e => setExpectedHarvest(e.target.value)}
                />
              </div>

              {/* Notes */}
              <div className="farms-form-group farms-span-2">
                <label className="farms-form-label">Notes & Health Log</label>
                <textarea
                  className="farms-form-input"
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Field notes, disease history, or fertilizer applications..."
                />
              </div>

              <div className="farms-span-2" style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button type="button" className="farms-cancel-btn" onClick={() => { resetForm(); setShowForm(false); }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="farms-submit-btn">
                  {loading ? (editingFarmId ? "Updating..." : "Registering...") : (editingFarmId ? "Update Farm" : "Register Farm")}
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

        {/* ── Farm Cards Grid ── */}
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
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        className="farms-card-edit-btn"
                        onClick={() => handleStartEdit(farm)}
                        title="Edit farm details"
                        type="button"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="farms-delete-btn"
                        onClick={() => handleDelete(farm.id!)}
                        title="Delete farm"
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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

                  {/* Expand / Collapse Notes & Event Tracker */}
                  <div className="farms-notes-section">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <button
                        className="farms-expand-btn"
                        onClick={() => setExpandedFarm(isExpanded ? null : farm.id!)}
                        type="button"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {isExpanded ? "Hide health tracker" : "View notes & timeline tracker"}
                      </button>
                      <button
                        type="button"
                        className="farms-log-entry-btn"
                        onClick={() => setLogModalFarm(farm)}
                        title="Log a new health event or update note"
                      >
                        <FileText size={13} /> + Log Event
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="farms-notes-box">
                        <span className="farms-section-label">Field Notes & Activity Timeline</span>
                        {farm.notes ? (
                          <div className="farms-timeline-entries">
                            {farm.notes.split("\n").map((line: string, idx: number) => (
                              <div key={idx} className="farms-timeline-row">
                                <span className="farms-timeline-dot" />
                                <span>{line}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontStyle: "italic", margin: 0 }}>No event notes logged yet. Click "+ Log Event" above to record disease occurrences, fertilizer dates, or field notes.</p>
                        )}
                      </div>
                    )}
                  </div>

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
                      type="button"
                    >
                      <CloudSun size={15} /> Weather
                    </button>
                    <button
                      className="farms-action-btn farms-action-scan"
                      onClick={() => navigate(`/disease-detection?farmId=${farm.id}&crop=${encodeURIComponent(farm.crop)}&farmName=${encodeURIComponent(farm.name)}`)}
                      type="button"
                    >
                      <Microscope size={15} /> Scan Disease
                    </button>
                  </div>

                </article>
              );
            })}
          </div>
        )}

        {/* ── Log Event Modal ── */}
        {logModalFarm && (
          <div className="farms-modal-backdrop" onClick={() => setLogModalFarm(null)}>
            <div className="farms-modal-card" onClick={e => e.stopPropagation()}>
              <h3 className="farms-modal-title">
                <FileText size={18} />
                Log Event for {logModalFarm.name}
              </h3>
              <p className="farms-modal-subtitle">Record disease sightings, sprays, fertilizer treatments, or status changes.</p>

              <form onSubmit={handleAddLogEvent}>
                <textarea
                  className="farms-form-input"
                  rows={4}
                  value={newEventText}
                  onChange={e => setNewEventText(e.target.value)}
                  placeholder="e.g. Late blight symptoms observed on bottom leaves. Applied copper fungicide spray."
                  required
                  autoFocus
                />
                <div className="farms-modal-actions">
                  <button type="button" className="farms-cancel-btn" onClick={() => setLogModalFarm(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="farms-submit-btn">
                    Save Log Entry
                  </button>
                </div>
              </form>
            </div>
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

        /* Required Star Indicator */
        .farms-req-star {
          color: #ef4444;
          font-weight: 800;
          margin-left: 2px;
        }

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
          background: rgba(255,255,255,0.75);
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
        [data-theme="dark"] .farms-form-input { background: rgba(20,32,24,0.75); color: #fff; }
        .farms-form-input:focus { border-color: var(--fp); box-shadow: 0 0 0 3px rgba(46,125,50,0.1); }
        .farms-form-select { cursor: pointer; }

        /* Custom Date Picker Styling */
        .farms-form-date-input {
          background: rgba(255, 255, 255, 0.85);
          border: 1.5px solid var(--fp-border);
          border-radius: 14px;
          padding: 10px 14px;
          font-size: 13.5px;
          font-weight: 500;
          color: var(--fp-text);
          outline: none;
          font-family: var(--fp-font);
          width: 100%;
          box-sizing: border-box;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        [data-theme="dark"] .farms-form-date-input {
          background: rgba(20, 32, 24, 0.85);
          color: #ffffff;
          color-scheme: dark;
        }
        .farms-form-date-input:focus {
          border-color: #2e7d32;
          box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.12);
        }

        /* Area Wrapper & Unit Badge */
        .farms-area-wrapper {
          display: flex;
          align-items: center;
          position: relative;
        }
        .farms-area-unit-badge {
          position: absolute;
          right: 12px;
          font-size: 12px;
          font-weight: 700;
          color: var(--fp-muted);
          background: var(--fp-light);
          padding: 4px 10px;
          border-radius: 8px;
          pointer-events: none;
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
        
        .farms-card-edit-btn {
          background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.2);
          color: #3b82f6; border-radius: 10px; padding: 8px; cursor: pointer;
          display: flex; align-items: center; transition: all 0.2s; flex-shrink: 0;
        }
        .farms-card-edit-btn:hover { background: rgba(59,130,246,0.15); }

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

        /* Notes & Timeline Tracker */
        .farms-notes-section { display: flex; flex-direction: column; gap: 8px; }
        .farms-log-entry-btn {
          background: var(--fp-light); border: 1px solid rgba(46,125,50,0.2);
          color: var(--fp); font-size: 11.5px; font-weight: 700; border-radius: 8px;
          padding: 4px 10px; cursor: pointer; display: flex; align-items: center; gap: 4px;
          transition: all 0.2s;
        }
        .farms-log-entry-btn:hover { background: rgba(46,125,50,0.15); }
        
        .farms-expand-btn {
          display: flex; align-items: center; gap: 6px;
          background: none; border: none; cursor: pointer;
          font-size: 12px; color: var(--fp); font-weight: 700; padding: 0;
        }
        .farms-notes-box { padding: 12px 14px; border-radius: 12px; background: rgba(0,0,0,0.02); border: 1px solid var(--fp-border); font-size: 13px; color: var(--fp-text); line-height: 1.5; }
        
        .farms-timeline-entries { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
        .farms-timeline-row { display: flex; align-items: flex-start; gap: 8px; font-size: 12.5px; color: var(--fp-text); }
        .farms-timeline-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--fp); margin-top: 6px; flex-shrink: 0; }

        /* Modal Backdrop */
        .farms-modal-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          backdrop-filter: blur(4px); z-index: 300; display: flex;
          align-items: center; justify-content: center; padding: 20px;
        }
        .farms-modal-card {
          background: var(--fp-card); border: 1px solid var(--fp-border);
          border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.2);
          width: 100%; max-width: 480px; padding: 24px; display: flex;
          flex-direction: column; gap: 14px; backdrop-filter: blur(20px);
        }
        .farms-modal-title { font-size: 18px; font-weight: 800; color: var(--fp-text); margin: 0; display: flex; align-items: center; gap: 8px; }
        .farms-modal-subtitle { font-size: 13px; color: var(--fp-muted); margin: 0; }
        .farms-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }

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
