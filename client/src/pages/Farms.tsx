import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState/EmptyState";
import MainLayout from "../layouts/MainLayout";
import { addFarm, fetchFarms, deleteFarm } from "../services/farmApi";
import { Farm } from "../types";

const Farms: React.FC = () => {
  const isLogin = useSelector((state: any) => state.auth.isLogin);

  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  // Form State
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [crop, setCrop] = useState("Paddy");
  const [soilType, setSoilType] = useState("Clayey");
  const [area, setArea] = useState("");
  const [sowingDate, setSowingDate] = useState("");

  const loadFarms = useCallback(() => {
    if (!isLogin) return;
    setFetching(true);
    fetchFarms()
      .then(({ data }) => {
        if (data.success && data.farms) {
          setFarms(data.farms);
        }
      })
      .catch((err) => {
        console.error("Failed to load farms", err);
      })
      .finally(() => {
        setFetching(false);
      });
  }, [isLogin]);

  useEffect(() => {
    loadFarms();
  }, [loadFarms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !crop || !soilType || !area || !sowingDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await addFarm({
        name,
        location,
        crop,
        soilType,
        area,
        sowingDate,
      });

      if (data.success && data.farm) {
        setFarms((prev) => [data.farm, ...prev]);
        toast.success("Farm added successfully!");
        
        // Reset form
        setName("");
        setLocation("");
        setArea("");
        setSowingDate("");
      }
    } catch (err: any) {
      console.error(err);
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
        setFarms((prev) => prev.filter((farm) => farm.id !== id));
        toast.success("Farm deleted successfully.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete farm.");
    }
  };

  if (!isLogin) {
    return (
      <MainLayout
        eyebrow="Farm Ecosystem"
        title="My Farms"
        subtitle="Manage your agricultural fields, crop cycles, and specific soil setups."
      >
        <EmptyState
          title="Authentication Required"
          message="Please register or log in to manage your active farms and soil settings."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      eyebrow="Farm Ecosystem"
      title="My Farms"
      subtitle="Register and manage your fields to receive targeted weather warnings, fertilizer schedules, and crop advisory tips."
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "24px", alignItems: "start" }}>
        
        {/* Left column: Add Farm Form */}
        <section className="liquid-glass-panel">
          <h2 style={{ fontSize: "18px", marginBottom: "16px", color: "#fff" }}>Add New Farm Field</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700" }}>Farm Name *</label>
              <input
                type="text"
                className="liquid-glass-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. North Valley Field"
                required
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700" }}>Location / Address</label>
              <input
                type="text"
                className="liquid-glass-input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Secunderabad, TS (optional)"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700" }}>Crop Type *</label>
                <select 
                  className="liquid-glass-input" 
                  style={{ background: "rgba(0,0,0,0.3)" }} 
                  value={crop} 
                  onChange={(e) => setCrop(e.target.value)}
                >
                  <option>Paddy</option>
                  <option>Wheat</option>
                  <option>Maize</option>
                  <option>Tomato</option>
                  <option>Cotton</option>
                  <option>Groundnut</option>
                  <option>Sugarcane</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700" }}>Soil Type *</label>
                <select 
                  className="liquid-glass-input" 
                  style={{ background: "rgba(0,0,0,0.3)" }} 
                  value={soilType} 
                  onChange={(e) => setSoilType(e.target.value)}
                >
                  <option>Clayey</option>
                  <option>Loamy</option>
                  <option>Black Cotton</option>
                  <option>Sandy</option>
                  <option>Alluvial</option>
                  <option>Red Sandy</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700" }}>Area (e.g. Acres) *</label>
                <input
                  type="text"
                  className="liquid-glass-input"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. 4.5 acres"
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: "700" }}>Sowing Date *</label>
                <input
                  type="date"
                  className="liquid-glass-input"
                  style={{ colorScheme: "dark" }}
                  value={sowingDate}
                  onChange={(e) => setSowingDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="glass-btn-primary" style={{ padding: "12px", marginTop: "8px" }}>
              {loading ? "Adding Farm..." : "Register Farm"}
            </button>
          </form>
        </section>

        {/* Right column: Farms List */}
        <section className="liquid-glass-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", margin: 0, color: "#fff" }}>Registered Fields</h2>
            
            {/* Toggle Card / List View */}
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className={`glass-btn-${viewMode === "card" ? "primary" : "secondary"}`}
                style={{ padding: "6px 12px", fontSize: "12px" }}
                onClick={() => setViewMode("card")}
              >
                Card View
              </button>
              <button
                type="button"
                className={`glass-btn-${viewMode === "list" ? "primary" : "secondary"}`}
                style={{ padding: "6px 12px", fontSize: "12px" }}
                onClick={() => setViewMode("list")}
              >
                List View
              </button>
            </div>
          </div>

          {fetching ? (
            <Loader label="Fetching farm fields from database..." />
          ) : farms.length === 0 ? (
            <div style={{ padding: "48px 16px", textAlign: "center", border: "1px dashed rgba(255,255,255,0.08)", borderRadius: "12px" }}>
              <p style={{ fontWeight: "700", margin: "0 0 8px 0" }}>No farms registered yet.</p>
              <span style={{ fontSize: "13px", opacity: 0.6 }}>Add your first farm field using the form to get started.</span>
            </div>
          ) : viewMode === "card" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "16px" }}>
              {farms.map((farm) => (
                <article
                  key={farm.id}
                  className="liquid-glass-card"
                  style={{
                    padding: "20px",
                    position: "relative",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: "0 0 4px 0", color: "#fff", fontSize: "16px" }}>{farm.name}</h3>
                      {farm.location && (
                        <span style={{ fontSize: "12px", opacity: 0.6, display: "block", marginBottom: "8px" }}>
                          📍 {farm.location}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(farm.id!)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#dc3545",
                        cursor: "pointer",
                        fontWeight: "800",
                        fontSize: "20px",
                        lineHeight: 1
                      }}
                      title="Delete Farm"
                    >
                      ×
                    </button>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginTop: "12px", background: "rgba(255,255,255,0.03)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <div>
                      <span style={{ fontSize: "10px", opacity: 0.5 }}>CROP</span>
                      <strong style={{ display: "block", color: "#52b788", fontSize: "13px" }}>{farm.crop}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "10px", opacity: 0.5 }}>SOIL</span>
                      <strong style={{ display: "block", color: "#52b788", fontSize: "13px" }}>{farm.soilType}</strong>
                    </div>
                    <div style={{ marginTop: "4px" }}>
                      <span style={{ fontSize: "10px", opacity: 0.5 }}>SIZE</span>
                      <strong style={{ display: "block", color: "#52b788", fontSize: "13px" }}>{farm.area}</strong>
                    </div>
                    <div style={{ marginTop: "4px" }}>
                      <span style={{ fontSize: "10px", opacity: 0.5 }}>SOWING</span>
                      <strong style={{ display: "block", color: "#52b788", fontSize: "13px" }}>
                        {new Date(farm.sowingDate).toLocaleDateString()}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            /* Tabular list layout */
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {farms.map((farm) => (
                <div 
                  key={farm.id} 
                  className="liquid-glass-card" 
                  style={{ 
                    padding: "12px 18px", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <strong style={{ color: "#fff", fontSize: "14px" }}>{farm.name}</strong>
                    <span style={{ fontSize: "11px", opacity: 0.6 }}>📍 {farm.location || "No location"}</span>
                  </div>
                  
                  <div style={{ display: "flex", gap: "24px", fontSize: "12px", alignItems: "center" }}>
                    <div>
                      <span style={{ opacity: 0.5, marginRight: "4px" }}>Crop:</span>
                      <strong style={{ color: "#52b788" }}>{farm.crop}</strong>
                    </div>
                    <div>
                      <span style={{ opacity: 0.5, marginRight: "4px" }}>Soil:</span>
                      <strong>{farm.soilType}</strong>
                    </div>
                    <div>
                      <span style={{ opacity: 0.5, marginRight: "4px" }}>Size:</span>
                      <strong>{farm.area}</strong>
                    </div>
                    <div>
                      <span style={{ opacity: 0.5, marginRight: "4px" }}>Sowing:</span>
                      <strong>{new Date(farm.sowingDate).toLocaleDateString()}</strong>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDelete(farm.id!)} 
                    style={{ 
                      background: "none", 
                      border: "none", 
                      color: "#dc3545", 
                      cursor: "pointer", 
                      fontSize: "20px",
                      fontWeight: 800
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </MainLayout>
  );
};

export default Farms;
