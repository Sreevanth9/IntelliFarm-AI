import React, { useState, useEffect, useCallback } from "react";
import farmLogo from "../assets/intellifarm-icon.png";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../utils/constants";
import { Alert } from "../types";
import { fetchAlerts, markAlertsRead, markAllAlertsRead } from "../services/alertsApi";

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const Navbar: React.FC = () => {
  const { farmer, isAuthenticated, logout } = useAuth() as any;
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeAlertTab, setActiveAlertTab] = useState<"all" | "unread" | "weather" | "disease" | "market">("all");

  const loadAlerts = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await fetchAlerts();
      setAlerts(data.alerts || []);
      const unreads = (data.alerts || []).filter((a: Alert) => !a.isRead).length;
      setUnreadCount(unreads);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAlerts();
      const interval = setInterval(loadAlerts, 45000);
      return () => clearInterval(interval);
    } else {
      setAlerts([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, loadAlerts]);

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAlertsRead({ id: alertId });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, isRead: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark alert as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsRead();
      setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
      setUnreadCount(0);
      toast.success("All alerts marked as read");
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const authClickHandler = async () => {
    if (isAuthenticated) {
      await logout();
      toast.success("Logged out");
      navigate("/login");
      return;
    }
    navigate("/login");
  };

  // Filter alerts by category/state tabs
  const filteredAlerts = alerts.filter((alert) => {
    if (activeAlertTab === "all") return true;
    if (activeAlertTab === "unread") return !alert.isRead;
    return alert.category?.toLowerCase() === activeAlertTab || alert.severity?.toLowerCase() === activeAlertTab;
  });

  return (
    <>
      <nav className="ag-navbar" style={{ padding: "0 24px", height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        
        {/* Brand/Logo */}
        {!isAuthenticated && (
          <div className="ag-navbar__brand" onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={farmLogo} alt="IntelliFarm AI" style={{ width: "40px", height: "40px", objectFit: "contain", borderRadius: "10px" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 800, fontSize: "18px", color: "var(--sidebar-active-color, #2e7d32)", letterSpacing: "-0.5px" }}>IntelliFarm AI</span>
              <small style={{ fontSize: "10px", opacity: 0.7, color: "var(--body-color)" }}>Smart Farming SaaS Ecosystem</small>
            </div>
          </div>
        )}

        {/* Global Search Bar (Shown when authenticated) */}
        {isAuthenticated && (
          <div className="ag-navbar__search" style={{ margin: "0 24px 0 0", flex: 1, maxWidth: "600px", position: "relative" }}>
            <span style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", opacity: 0.5, fontSize: "14px" }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search farms, crops, scanning history..." 
              className="liquid-glass-input" 
              style={{
                width: "100%",
                padding: "8px 16px 8px 42px",
                fontSize: "13px",
                height: "38px",
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                color: "#ffffff"
              }}
            />
          </div>
        )}

        {/* Actions Area */}
        <div className="ag-navbar__actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          
          {isAuthenticated && (
            <div className="ag-notification-container" style={{ position: "relative" }}>
              <button 
                type="button" 
                className="ag-notification-bell" 
                onClick={() => setDrawerOpen(!drawerOpen)}
                aria-label="View alerts"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "8px",
                  borderRadius: "12px",
                  cursor: "pointer",
                  color: "var(--body-color)",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <BellIcon />
                {unreadCount > 0 && (
                  <span className="bell-badge" style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "#e63946",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: 700,
                    borderRadius: "50%",
                    minWidth: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px"
                  }}>{unreadCount}</span>
                )}
              </button>
              
              {/* Notification Center Dropdown with tabs */}
              {drawerOpen && (
                <div className="ag-notification-dropdown liquid-glass-panel" style={{
                  position: "absolute",
                  right: 0,
                  top: "48px",
                  width: "360px",
                  zIndex: 10,
                  padding: 0,
                  overflow: "hidden",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                  background: "rgba(8, 28, 21, 0.95)",
                  borderColor: "rgba(255,255,255,0.08)"
                }}>
                  
                  {/* Dropdown Header */}
                  <div className="ag-dropdown-header" style={{
                    padding: "16px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#fff" }}>Notification Center</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead} 
                        className="mark-all-read-btn"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#52b788",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Filtering tabs */}
                  <div style={{
                    display: "flex",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    background: "rgba(0, 0, 0, 0.15)",
                    fontSize: "11px"
                  }}>
                    {(["all", "unread", "weather", "disease", "market"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveAlertTab(tab)}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          background: "transparent",
                          color: activeAlertTab === tab ? "#52b788" : "#8e918f",
                          border: "none",
                          borderBottom: activeAlertTab === tab ? "2px solid #52b788" : "2px solid transparent",
                          cursor: "pointer",
                          fontWeight: 600,
                          textTransform: "capitalize"
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  
                  {/* Alert Lists */}
                  <div className="ag-dropdown-body" style={{ maxHeight: "300px", overflowY: "auto", padding: "10px" }}>
                    {filteredAlerts.length === 0 ? (
                      <p className="empty-alerts" style={{ textAlign: "center", padding: "30px", opacity: 0.5, fontSize: "13px" }}>
                        No alerts found in this section.
                      </p>
                    ) : (
                      filteredAlerts.map((alert) => (
                        <div 
                          key={alert.id} 
                          className={`ag-alert-item ${alert.isRead ? 'read' : 'unread'} ${alert.severity}`}
                          onClick={() => !alert.isRead && handleMarkAsRead(alert.id)}
                          style={{
                            padding: "12px",
                            borderRadius: "10px",
                            marginBottom: "8px",
                            cursor: "pointer",
                            background: alert.isRead ? "rgba(255, 255, 255, 0.02)" : "rgba(82, 183, 136, 0.08)",
                            border: `1px solid ${alert.isRead ? "rgba(255,255,255,0.04)" : "rgba(82, 183, 136, 0.15)"}`,
                            position: "relative",
                            transition: "all 0.2s"
                          }}
                        >
                          <div className="alert-item-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <span className={`alert-category-badge ${alert.category}`} style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              background: alert.category === "weather" ? "rgba(2, 132, 199, 0.2)" : alert.category === "disease" ? "rgba(211, 47, 47, 0.2)" : "rgba(245, 158, 11, 0.2)",
                              color: alert.category === "weather" ? "#38bdf8" : alert.category === "disease" ? "#f87171" : "#fbbf24",
                            }}>
                              {alert.category}
                            </span>
                            <span className="alert-time" style={{ fontSize: "10px", opacity: 0.5 }}>
                              {new Date(alert.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", fontWeight: 700, color: "#fff" }}>{alert.title}</h4>
                          <p style={{ margin: 0, fontSize: "11px", opacity: 0.8, lineHeight: "1.3" }}>{alert.message}</p>
                          {!alert.isRead && (
                            <span className="unread-dot" style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              width: "6px",
                              height: "6px",
                              background: "#52b788",
                              borderRadius: "50%"
                            }}></span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile circular avatar dropdown trigger */}
          {isAuthenticated && (
            <NavLink to={ROUTES.profile} className="ag-profile-avatar" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
              <img 
                src={farmer?.profileImg || farmer?.profile_img || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"} 
                alt="Profile" 
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "2px solid var(--sidebar-active-color, #2e7d32)",
                  objectFit: "cover",
                  background: "rgba(255, 255, 255, 0.1)"
                }} 
              />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--body-color)" }}>
                {farmer?.name || "Farmer"}
              </span>
            </NavLink>
          )}

          <button 
            className="glass-btn-primary" 
            type="button" 
            onClick={authClickHandler}
            style={{ padding: "8px 16px", fontSize: "13px", height: "36px" }}
          >
            {isAuthenticated ? "Logout" : "Login"}
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
