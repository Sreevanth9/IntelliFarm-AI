import { NavLink, useNavigate } from "react-router-dom";
import { ROUTES } from "../utils/constants";
import farmLogo from "../assets/intellifarm-icon.png";
import { useEffect, useRef } from "react";

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
  Sparkles,
  X
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const closeBtnRef = useRef(null);
  const isMobileDrawer = () => window.innerWidth <= 1024;

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
      .catch((err) => {
        console.error("Logout failed:", err);
      });
  };

  // Move focus into drawer when opened on mobile
  useEffect(() => {
    if (isOpen && isMobileDrawer()) {
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && isOpen) onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open on mobile/tablet
  useEffect(() => {
    if (isOpen && isMobileDrawer()) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Re-evaluate body scroll on resize to avoid stale lock
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1025) {
        document.body.style.overflow = "";
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleNavClick = () => {
    if (isMobileDrawer()) onClose?.();
  };

  const renderMenuItems = (items) => {
    return items.map((item) => {
      const IconComponent = item.icon;
      return (
        <NavLink
          key={item.href}
          to={item.href}
          onClick={handleNavClick}
          className={({ isActive }) =>
            isActive ? "sidebar-item sidebar-item-active" : "sidebar-item"
          }
        >
          <span className="sidebar-icon">
            <IconComponent size={22} strokeWidth={2} />
          </span>
          <span className="sidebar-text">{item.label}</span>
          {item.badgeCount && (
            <span className="sidebar-badge">{item.badgeCount}</span>
          )}
          <ChevronRight size={16} className="sidebar-chevron" />
        </NavLink>
      );
    });
  };

  return (
    <>
      {/* Backdrop — visible on mobile/tablet when drawer is open */}
      <div
        className={`sidebar-backdrop${isOpen ? " visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        id="main-sidebar"
        className={`sidebar${isOpen ? " sidebar-open" : ""}`}
        role={isOpen && isMobileDrawer() ? "dialog" : undefined}
        aria-modal={isOpen && isMobileDrawer() ? "true" : undefined}
        aria-label="Navigation menu"
      >
        {/* Close button — shown inside drawer on ≤1024px */}
        <button
          ref={closeBtnRef}
          className="sidebar-close-btn"
          onClick={onClose}
          aria-label="Close navigation menu"
          type="button"
        >
          <X size={16} />
        </button>

        {/* Logo / Brand */}
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

        {/* Scrollable nav */}
        <nav className="sidebar-nav">
          <div className="sidebar-menu-group">
            {renderMenuItems(group1)}
          </div>

          <hr className="sidebar-divider" />

          <div className="sidebar-menu-group">
            {renderMenuItems(group2)}
          </div>

          <hr className="sidebar-divider" />

          <div className="sidebar-menu-group">
            {renderMenuItems(group4)}
          </div>

          <hr className="sidebar-divider" />

          <button onClick={handleLogout} className="sidebar-logout">
            <span className="sidebar-icon" style={{ color: "#FF4D4D" }}>
              <LogOut size={18} strokeWidth={2} />
            </span>
            <span className="sidebar-text">Logout</span>
            <ChevronRight size={16} className="sidebar-chevron" style={{ color: "#FF4D4D" }} />
          </button>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
