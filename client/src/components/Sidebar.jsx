import { NavLink, useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/constants";
import farmLogo from "../assets/intellifarm-icon.png";

import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import {
  LayoutDashboard,
  Tractor,
  Microscope,
  CloudSun,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles
} from "lucide-react";

const Sidebar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const group1 = [
    { label: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard },
    { label: "Spryzen AI", href: ROUTES.copilot, icon: Sparkles },
    { label: "Disease Detection", href: ROUTES.diseaseDetection, icon: Microscope },
  ];

  const group2 = [
    { label: "My Farms", href: ROUTES.farms, icon: Tractor },
    { label: "Weather", href: ROUTES.weather, icon: CloudSun },
  ];



  const group4 = [
    { label: "Profile", href: ROUTES.profile, icon: User },
    { label: "Settings", href: ROUTES.settings, icon: Settings },
  ];

  const handleLogout = () => {
    logout()
      .then(() => {
        toast.success("Logged out successfully");
        navigate("/login");
      })
      .catch((err: any) => {
        console.error("Logout failed:", err);
      });
  };

  const renderMenuItems = (items: typeof group1) => {
    return items.map((item) => {
      const IconComponent = item.icon;
      return (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            isActive ? "sidebar-item sidebar-item-active" : "sidebar-item"
          }
        >
          <span className="sidebar-icon">
            <IconComponent size={22} strokeWidth={2} />
          </span>
          <span className="sidebar-text">{item.label}</span>
          {item.badgeCount && (
            <span className="sidebar-badge">
              {item.badgeCount}
            </span>
          )}
          <ChevronRight size={16} className="sidebar-chevron" />
        </NavLink>
      );
    });
  };

  return (
    <aside className="sidebar">
      {/* 1. Fixed Header Area (Logo Only) */}
      <div className="sidebar-header-fixed" style={{ marginBottom: "16px" }}>
        <div className="sidebar-header" style={{ marginBottom: "16px" }}>
          <img src={farmLogo} alt="IntelliFarm AI Logo" className="sidebar-logo-img" />
          <div className="sidebar-brand">
            <span className="sidebar-brand-title">IntelliFarm AI</span>
            <span className="sidebar-brand-subtitle">Smart Farming.<br />Better Decisions.</span>
          </div>
        </div>
        <hr className="sidebar-divider" style={{ margin: 0 }} />
      </div>

      {/* 2. Scrollable Content Area */}
      <nav className="sidebar-nav">

        {/* Group 1: Dashboard & AI Services */}
        <div className="sidebar-menu-group">
          {renderMenuItems(group1)}
        </div>

        <hr className="sidebar-divider" />

        {/* Group 2: Farm Ops */}
        <div className="sidebar-menu-group">
          {renderMenuItems(group2)}
        </div>



        <hr className="sidebar-divider" />

        {/* Group 4: Account / Config */}
        <div className="sidebar-menu-group">
          {renderMenuItems(group4)}
        </div>

        <hr className="sidebar-divider" />

        {/* Section 5: Logout Action */}
        <button onClick={handleLogout} className="sidebar-logout">
          <span className="sidebar-icon" style={{ color: "#FF4D4D" }}>
            <LogOut size={18} strokeWidth={2} />
          </span>
          <span className="sidebar-text">Logout</span>
          <ChevronRight size={16} className="sidebar-chevron" style={{ color: "#FF4D4D" }} />
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
