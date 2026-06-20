import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import MainLayout from "../layouts/MainLayout";
import { fetchAlerts, markAlertsRead, markAllAlertsRead } from "../services/alertsApi";
import { Alert } from "../types";

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "weather" | "disease" | "crop" | "market">("all");

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await fetchAlerts();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error("Failed to load alerts:", err);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAlertsRead({ id });
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      );
      toast.success("Alert marked as read");
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
      toast.error("Failed to update alert");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      toast.success("All alerts marked as read");
    } catch (err) {
      console.error("Failed to mark all read:", err);
      toast.error("Failed to update alerts");
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const severityMatch = filter === "all" || alert.severity === filter;
    const categoryMatch = categoryFilter === "all" || alert.category === categoryFilter;
    return severityMatch && categoryMatch;
  });

  return (
    <MainLayout
      eyebrow="Notifications & Security warnings"
      title="Alert Center"
      subtitle="Critical farming alerts, weather updates, and market warnings."
      actions={
        alerts.some(a => !a.isRead) ? (
          <button onClick={handleMarkAllRead} className="glass-btn-secondary" style={{ padding: "8px 16px" }}>
            Mark All Read
          </button>
        ) : undefined
      }
    >
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div className="liquid-glass-card" style={{ padding: "8px 16px", display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#5b6b62" }}>Severity:</span>
          {(["all", "low", "medium", "high"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                background: filter === s ? "#2e7d32" : "transparent",
                color: filter === s ? "#fff" : "#5b6b62",
                cursor: "pointer",
                textTransform: "capitalize"
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="liquid-glass-card" style={{ padding: "8px 16px", display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "14px", fontWeight: 700, color: "#5b6b62" }}>Category:</span>
          {(["all", "weather", "disease", "crop", "market"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              style={{
                padding: "6px 12px",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 700,
                background: categoryFilter === c ? "#2e7d32" : "transparent",
                color: categoryFilter === c ? "#fff" : "#5b6b62",
                cursor: "pointer",
                textTransform: "capitalize"
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="liquid-glass-panel" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          <p>Loading alerts...</p>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#5b6b62" }}>
            <span style={{ fontSize: "40px" }}>🔔</span>
            <h3 style={{ marginTop: "16px" }}>No alerts found</h3>
            <p>You are all caught up!</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`liquid-glass-card`}
              style={{
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                background: alert.isRead ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.6)",
                borderLeft: `5px solid ${
                  alert.severity === "high"
                    ? "#e53935"
                    : alert.severity === "medium"
                    ? "#fb8c00"
                    : "#4caf50"
                }`,
                cursor: alert.isRead ? "default" : "pointer"
              }}
              onClick={() => !alert.isRead && handleMarkAsRead(alert.id)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    background: "rgba(46, 125, 50, 0.08)",
                    color: "#2e7d32"
                  }}
                >
                  {alert.category}
                </span>
                <span style={{ fontSize: "12px", color: "#666" }}>
                  {new Date(alert.createdAt).toLocaleDateString()} at{" "}
                  {new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#183d24", display: "flex", gap: "8px", alignItems: "center" }}>
                {alert.title}
                {!alert.isRead && (
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2e7d32" }} />
                )}
              </h3>
              <p style={{ margin: 0, fontSize: "14px", color: "#5b6b62", lineHeight: "1.5" }}>{alert.message}</p>
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
};

export default Alerts;
