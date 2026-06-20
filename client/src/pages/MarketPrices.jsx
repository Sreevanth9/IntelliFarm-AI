import React, { useMemo, useState, useEffect } from "react";
import EmptyState from "../components/EmptyState/EmptyState";
import MainLayout from "../layouts/MainLayout";
import marketData from "../data/marketPrices.json";
import toast from "react-hot-toast";

const MarketPrices = () => {
  const [search, setSearch] = useState("");
  const [state, setState] = useState("All");
  const [season, setSeason] = useState("All");
  
  // Starred favorites state synced with localStorage
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("crop_favorites");
    return saved ? JSON.parse(saved) : ["Rice", "Cotton", "Tomato"];
  });

  useEffect(() => {
    localStorage.setItem("crop_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (cropName) => {
    setFavorites((prev) => {
      const isFav = prev.includes(cropName);
      let updated;
      if (isFav) {
        updated = prev.filter((c) => c !== cropName);
        toast.success(`Removed ${cropName} from favorites`);
      } else {
        updated = [...prev, cropName];
        toast.success(`Added ${cropName} to favorites`);
      }
      return updated;
    });
  };

  const states = ["All", ...new Set(marketData.map((item) => item.state))];
  const seasons = ["All", ...new Set(marketData.map((item) => item.season))];

  // Separate Top Gainers and Losers
  const topGainers = useMemo(() => {
    return [...marketData].sort((a, b) => b.trend - a.trend).slice(0, 3);
  }, []);

  const topLosers = useMemo(() => {
    return [...marketData].sort((a, b) => a.trend - b.trend).slice(0, 3);
  }, []);

  // Filter and prioritize favorites
  const processedPrices = useMemo(() => {
    const query = search.toLowerCase();
    
    // First, filter by criteria
    const filtered = marketData.filter((item) => {
      const matchesSearch =
        item.crop.toLowerCase().includes(query) ||
        item.state.toLowerCase().includes(query) ||
        item.market.toLowerCase().includes(query);
      const matchesState = state === "All" || item.state === state;
      const matchesSeason = season === "All" || item.season === season;
      return matchesSearch && matchesState && matchesSeason;
    });

    // Then, sort so favorites appear first
    return filtered.sort((a, b) => {
      const aIsFav = favorites.includes(a.crop);
      const bIsFav = favorites.includes(b.crop);
      if (aIsFav && !bIsFav) return -1;
      if (!aIsFav && bIsFav) return 1;
      return 0;
    });
  }, [search, state, season, favorites]);

  return (
    <MainLayout
      eyebrow="Market Intelligence"
      title="Market Mandi Prices"
      subtitle="Track live mandi crop prices, trace positive/negative trends, and manage favorite crops"
    >
      {/* Top Gainers & Losers row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        
        {/* Gainers */}
        <section className="liquid-glass-panel" style={{ borderLeft: "4px solid #52b788" }}>
          <h2 style={{ fontSize: "16px", color: "#fff", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📈</span> Top Market Gainers
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {topGainers.map((item, idx) => (
              <div key={idx} className="liquid-glass-card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ color: "#fff" }}>{item.crop}</strong>
                  <span style={{ fontSize: "11px", opacity: 0.6, marginLeft: "10px" }}>{item.market} ({item.state})</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#52b788" }}>+{item.trend}%</span>
                  <span style={{ fontSize: "11px", opacity: 0.7 }}>Rs {item.price}/q</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Losers */}
        <section className="liquid-glass-panel" style={{ borderLeft: "4px solid #ef4444" }}>
          <h2 style={{ fontSize: "16px", color: "#fff", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📉</span> Top Market Losers
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {topLosers.map((item, idx) => (
              <div key={idx} className="liquid-glass-card" style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ color: "#fff" }}>{item.crop}</strong>
                  <span style={{ fontSize: "11px", opacity: 0.6, marginLeft: "10px" }}>{item.market} ({item.state})</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: "bold", color: "#ef4444" }}>{item.trend}%</span>
                  <span style={{ fontSize: "11px", opacity: 0.7 }}>Rs {item.price}/q</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Search and Filters */}
      <div className="liquid-glass-panel" style={{ padding: "20px", marginBottom: "24px" }}>
        <h2 style={{ fontSize: "15px", marginBottom: "12px", color: "#fff" }}>Search & Filters</h2>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px" }}>
          <input
            className="liquid-glass-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search crop commodity, state location, or mandi..."
          />
          <select 
            className="liquid-glass-input" 
            style={{ background: "rgba(0,0,0,0.3)" }}
            value={state} 
            onChange={(event) => setState(event.target.value)}
          >
            {states.map((s) => <option key={s} value={s}>{s === "All" ? "All States" : s}</option>)}
          </select>
          <select 
            className="liquid-glass-input" 
            style={{ background: "rgba(0,0,0,0.3)" }}
            value={season} 
            onChange={(event) => setSeason(event.target.value)}
          >
            {seasons.map((s) => <option key={s} value={s}>{s === "All" ? "All Seasons" : s}</option>)}
          </select>
        </div>
      </div>

      {/* Commodity Cards Grid */}
      {processedPrices.length === 0 ? (
        <EmptyState title="No mandi data matches filter" message="Search another commodity or location." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {processedPrices.map((item) => {
            const isFav = favorites.includes(item.crop);
            return (
              <div
                key={`${item.crop}-${item.market}`}
                className="liquid-glass-card"
                style={{
                  padding: "20px",
                  border: isFav ? "1px solid rgba(82, 183, 136, 0.25)" : "1px solid rgba(255, 255, 255, 0.08)",
                  background: isFav ? "rgba(82, 183, 136, 0.04)" : "var(--glass-bg)",
                  position: "relative"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "#fff", fontWeight: 700 }}>
                      {item.crop}
                    </h3>
                    <span style={{ fontSize: "11px", opacity: 0.6, display: "block" }}>📍 {item.market} ({item.state})</span>
                  </div>
                  <button
                    onClick={() => toggleFavorite(item.crop)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "18px",
                      opacity: isFav ? 1 : 0.4,
                      transition: "opacity 0.2s"
                    }}
                    title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    ⭐
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "16px" }}>
                  <div>
                    <span style={{ fontSize: "10px", opacity: 0.5 }}>CURRENT RATE</span>
                    <strong style={{ display: "block", fontSize: "16px", color: "#fff" }}>Rs {item.price} <small style={{ fontSize: "10px", fontWeight: "normal" }}>/ quintal</small></strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "10px", opacity: 0.5, display: "block" }}>DAILY TREND</span>
                    <strong style={{ color: item.trend >= 0 ? "#52b788" : "#ef4444", fontSize: "14px" }}>
                      {item.trend >= 0 ? "+" : ""}{item.trend}%
                    </strong>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", opacity: 0.6, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px", marginTop: "12px" }}>
                  <span>Season: {item.season}</span>
                  <span>Arrival: {item.arrival}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Historical trends summary chart */}
      <section className="liquid-glass-panel" style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "16px", color: "#fff", marginBottom: "16px" }}>Price Trends Distribution</h2>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", height: "160px", padding: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {marketData.slice(0, 6).map((item) => {
            const heightPercent = Math.max(30, Math.min(100, item.price / 80));
            return (
              <div key={item.crop} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                <span style={{ fontSize: "11px", color: "#52b788", fontWeight: "bold", marginBottom: "4px" }}>Rs {item.price}</span>
                <div style={{
                  width: "100%",
                  maxWidth: "40px",
                  height: `${heightPercent}%`,
                  background: "linear-gradient(to top, rgba(82, 183, 136, 0.1) 0%, #52b788 100%)",
                  borderRadius: "6px 6px 0 0"
                }}></div>
                <span style={{ fontSize: "11px", opacity: 0.6, marginTop: "6px" }}>{item.crop}</span>
              </div>
            );
          })}
        </div>
      </section>

    </MainLayout>
  );
};

export default MarketPrices;
