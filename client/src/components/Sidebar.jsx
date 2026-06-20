import { NavLink, useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/constants";
import farmLogo from "../assets/intellifarm-icon.png";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const mainItems = [
    { label: "Dashboard", href: ROUTES.dashboard, icon: "📊" },
    { label: "My Farms", href: ROUTES.farms, icon: "🌾" },
    { label: "Disease Detection", href: ROUTES.diseaseDetection, icon: "🔬" },
    { label: "Market Intelligence", href: ROUTES.marketPrices, icon: "📈" },
    { label: "Weather", href: ROUTES.weather, icon: "☁️" },
    { label: "Alerts", href: ROUTES.alerts, icon: "🔔" },
    { label: "AI Assistant", href: ROUTES.assistant, icon: "🤖" },
    { label: "Community", href: ROUTES.community, icon: "🤝" },
  ];

  const bottomItems = [
    { label: "Profile", href: ROUTES.profile, icon: "👤" },
    { label: "Settings", href: ROUTES.settings, icon: "⚙️" },
  ];

  const handleLogoutClick = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <aside className="ag-sidebar" style={{
      padding: "20px 16px",
      display: "flex",
      flexDirection: "column",
      minWidth: "260px",
      width: "260px",
      borderTop: "none",
      borderBottom: "none",
      borderLeft: "none",
      height: "100vh",
      position: "sticky",
      top: "0",
      zIndex: 10,
    }}>
      {/* Brand header */}
      <div className="sidebar-brand" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", marginBottom: "24px" }}>
        <img src={farmLogo} alt="IntelliFarm AI" style={{ width: "38px", height: "38px", objectFit: "contain", borderRadius: "10px", boxShadow: "0 0 15px rgba(82, 183, 136, 0.2)" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontWeight: 800, fontSize: "16px", color: "var(--sidebar-active-color, #52b788)", letterSpacing: "-0.5px" }}>IntelliFarm AI</span>
          <small style={{ fontSize: "9px", opacity: 0.6, color: "var(--body-color)" }}>SaaS Farming Ecosystem</small>
        </div>
      </div>

      {/* Main navigation list */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px", paddingRight: "4px" }}>
        {mainItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              isActive ? "sidebar-link-custom active" : "sidebar-link-custom"
            }
          >
            <span style={{ fontSize: "16px" }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Bottom section (Pro Card + Profile + Settings + Logout) */}
      <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "16px", marginTop: "12px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {/* Upgrade to Pro Card */}
        <div className="upgrade-pro-card" style={{
          padding: "14px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, rgba(82, 183, 136, 0.1) 0%, rgba(15, 118, 110, 0.04) 100%)",
          border: "1px solid rgba(82, 183, 136, 0.2)",
          marginBottom: "16px",
          textAlign: "left",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.15)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
            <span style={{ fontSize: "12px" }}>⭐</span>
            <span style={{ fontSize: "10px", fontWeight: "bold", color: "#52b788", letterSpacing: "1px" }}>UPGRADE TO PRO</span>
          </div>
          <p style={{ fontSize: "10px", margin: "0 0 10px 0", opacity: 0.7, color: "var(--body-color)", lineHeight: "1.3" }}>
            Premium crop analysis & weather telemetry triggers.
          </p>
          <button className="glass-btn-primary" style={{ width: "100%", padding: "6px", fontSize: "10px", borderRadius: "6px" }}>
            Get 7 Days Free
          </button>
        </div>

        {bottomItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              isActive ? "sidebar-link-custom active" : "sidebar-link-custom"
            }
          >
            <span style={{ fontSize: "16px" }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Logout Button */}
        <button
          onClick={handleLogoutClick}
          className="sidebar-link-custom"
          style={{
            background: "transparent",
            border: "1px solid transparent",
            width: "100%",
            textAlign: "left",
            cursor: "pointer",
            outline: "none",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginTop: "2px"
          }}
        >
          <span style={{ fontSize: "16px" }}>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
