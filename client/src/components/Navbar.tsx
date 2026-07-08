import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../utils/constants";
import { uiAction } from "../store/ui-gemini";
import { Search as SearchIcon, Sun, Moon, ChevronDown } from "lucide-react";

const Navbar: React.FC = () => {
  const { farmer, isAuthenticated, logout } = useAuth() as any;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isDarkRedux = useSelector((state: any) => state.ui.isDark);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const authClickHandler = async () => {
    if (isAuthenticated) {
      await logout();
      toast.success("Logged out");
      navigate("/login");
      return;
    }
    navigate("/login");
  };

  const handleToggleTheme = () => {
    dispatch(uiAction.toggleTheme());
    const nextTheme = isDarkRedux ? "light" : "dark";
    localStorage.setItem("theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    toast.success(`Switched to ${nextTheme} mode`);
  };



  return (
    <>
      <nav className="top-navbar">
        
        {/* Left Section: Search (Width 650px, height 56px) */}
        <div className="search-container">
          {isAuthenticated && (
            <>
              <SearchIcon className="sidebar-search-icon" size={18} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search farms, crops, scanning history..." 
                className="search-input" 
              />
              <span style={{
                position: "absolute",
                right: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.04)",
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: "6px",
                padding: "3px 8px",
                fontSize: "11px",
                fontWeight: 600,
                color: "#64748B",
                pointerEvents: "none"
              }}>
                ⌘ K
              </span>
            </>
          )}
        </div>

        {/* Center Spacer (Keeps search left, profile right) */}
        <div style={{ flex: 1 }}></div>

        {/* Right Section: Actions (Notification, Theme, Profile) */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          
          {/* 2. Theme Toggle Button */}
          <button 
            type="button" 
            className="theme-toggle-btn"
            onClick={handleToggleTheme}
            aria-label="Toggle theme"
          >
            {isDarkRedux ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* 3. Profile Card */}
          {isAuthenticated && (
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <div 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="profile-card"
              >
                {/* SV Green/Mint Avatar */}
                <div className="profile-avatar">
                  {farmer?.profileImg || farmer?.profile_img ? (
                    <img 
                      src={farmer?.profileImg || farmer?.profile_img} 
                      alt="Profile" 
                      style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} 
                    />
                  ) : (
                    <span>
                      {(farmer?.name || "SV").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  )}
                </div>
                
                {/* Name & Role */}
                <div className="profile-info">
                  <span className="profile-name">
                    {farmer?.name || "Sreevanth Vadlamudi"}
                  </span>
                  <span className="profile-role">
                    Farmer
                  </span>
                </div>
                
                {/* Caret */}
                <ChevronDown className="profile-chevron" size={16} />
              </div>

              {/* Profile Dropdown Overlay */}
              {profileDropdownOpen && (
                <div className="profile-dropdown">
                  <div 
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate(ROUTES.profile);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      color: "#1E293B",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                    className="dropdown-item-hover"
                  >
                    👤 My Profile
                  </div>
                  <div 
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate(ROUTES.settings);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      color: "#1E293B",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                    className="dropdown-item-hover"
                  >
                    ⚙️ Settings
                  </div>
                  <div 
                    onClick={() => {
                      toast("Help & Documentation center coming soon!");
                      setProfileDropdownOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      color: "#1E293B",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                    className="dropdown-item-hover"
                  >
                    ❓ Help
                  </div>
                  <hr style={{ border: 0, borderTop: "1px solid rgba(0, 0, 0, 0.04)", margin: "4px 0" }} />
                  <div 
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      authClickHandler();
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      color: "#d32f2f",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                    className="dropdown-item-hover"
                  >
                    🚪 Logout
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
      
      <style>{`
        .dropdown-item-hover:hover {
          background: rgba(47, 184, 107, 0.08) !important;
          color: #1D7A46 !important;
        }
      `}</style>
    </>
  );
};

export default Navbar;
