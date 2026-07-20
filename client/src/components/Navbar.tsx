import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../utils/constants";
import { uiAction } from "../store/ui";
import {
  Search as SearchIcon,
  Sun,
  Moon,
  ChevronDown,
  User,
  Settings,
  CircleHelp,
  LogOut,
} from "lucide-react";

interface SearchableItem {
  title: string;
  category: string;
  description: string;
  route: string;
}

const SEARCHABLE_ITEMS: SearchableItem[] = [
  { title: "Sreevanth Farm", category: "Farms", description: "Hyderabad, Telangana • Active", route: "/farms" },
  { title: "Nalgonda Field", category: "Farms", description: "Paddy crop • Healthy Area", route: "/farms" },
  { title: "Bacterial Leaf Blight", category: "Diseases", description: "Paddy disease information & organic cures", route: "/disease-info" },
  { title: "Powdery Mildew", category: "Diseases", description: "Wheat & vegetable crop disease guidelines", route: "/disease-info" },
  { title: "Weather Forecast", category: "Services", description: "Check rain chances, humidity & temperatures", route: "/weather" },
  { title: "AI Farming Assistant", category: "AI Services", description: "Chat about soil health, crops, & pest solutions", route: "/assistant" },
  { title: "Fertilizer Guide", category: "Services", description: "Dosage calculation and schedule recommendations", route: "/fertilizer" },
  { title: "Government Schemes", category: "Services", description: "Subsidies, insurance policies & crop support", route: "/schemes" }
];

const Navbar: React.FC<{ onMenuClick?: () => void; sidebarOpen?: boolean }> = ({ onMenuClick, sidebarOpen = false }) => {
  const { farmer, isAuthenticated, logout } = useAuth() as any;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isDarkRedux = useSelector((state: any) => state.ui.isDark);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const popupInputRef = useRef<HTMLInputElement>(null);

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
        setIsSearchOpen(true);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        popupInputRef.current?.focus();
      }, 80);
    } else {
      setSearchQuery("");
    }
  }, [isSearchOpen]);

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
  };

  const filteredItems = SEARCHABLE_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <nav className="top-navbar">

        {/* Hamburger — visible on ≤1024px to open sidebar drawer */}
        <button
          type="button"
          className="navbar-hamburger"
          onClick={onMenuClick}
          aria-label={sidebarOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={sidebarOpen}
          aria-controls="main-sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="5" x2="18" y2="5" />
            <line x1="2" y1="10" x2="18" y2="10" />
            <line x1="2" y1="15" x2="18" y2="15" />
          </svg>
        </button>

        {/* Left Section: Search Trigger */}
        {isAuthenticated && (
          <div 
            className="search-container" 
            onClick={() => setIsSearchOpen(true)}
            style={{ cursor: "pointer" }}
          >
            <>
              <SearchIcon className="sidebar-search-icon" size={18} />
              <div 
                className="search-input-placeholder"
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "20px",
                  background: "var(--search-bg)",
                  border: "1px solid var(--search-border)",
                  padding: "0 56px 0 52px",
                  fontSize: "14px",
                  color: "var(--sidebar-text-color)",
                  display: "flex",
                  alignItems: "center",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                  boxSizing: "border-box"
                }}
              >
                Search farms, crops, scanning history...
              </div>
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
          </div>
        )}

        {/* Center Spacer */}
        <div style={{ flex: 1, minWidth: 0 }}></div>

        {/* Right Section: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          
          {/* Theme Toggle Button */}
          <button 
            type="button" 
            className="theme-toggle-btn"
            onClick={handleToggleTheme}
            aria-label="Toggle theme"
          >
            {isDarkRedux ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Profile Card */}
          {isAuthenticated && (
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <div 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="profile-card"
              >
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
                
                <div className="profile-info">
                  <span className="profile-name">
                    {farmer?.name || "Sreevanth Vadlamudi"}
                  </span>
                  <span className="profile-role">
                    Farmer
                  </span>
                </div>
                
                <ChevronDown className="profile-chevron" size={16} />
              </div>

              {profileDropdownOpen && (
                <div className="profile-dropdown" role="menu">
                  <button 
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate(ROUTES.profile);
                    }}
                    className="profile-dropdown-item"
                    role="menuitem"
                  >
                    <span className="profile-dropdown-icon">
                      <User size={16} />
                    </span>
                    <span>My Profile</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate(ROUTES.settings);
                    }}
                    className="profile-dropdown-item"
                    role="menuitem"
                  >
                    <span className="profile-dropdown-icon">
                      <Settings size={16} />
                    </span>
                    <span>Settings</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      toast("Help & Documentation center coming soon!");
                      setProfileDropdownOpen(false);
                    }}
                    className="profile-dropdown-item"
                    role="menuitem"
                  >
                    <span className="profile-dropdown-icon">
                      <CircleHelp size={16} />
                    </span>
                    <span>Help</span>
                  </button>
                  <div className="profile-dropdown-divider" />
                  <button 
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      authClickHandler();
                    }}
                    className="profile-dropdown-item profile-dropdown-item-danger"
                    role="menuitem"
                  >
                    <span className="profile-dropdown-icon">
                      <LogOut size={16} />
                    </span>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Center Popup Search Modal */}
      {isSearchOpen && (
        <div 
          className="search-modal-overlay" 
          onClick={() => setIsSearchOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 18, 16, 0.5)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "center",
            paddingTop: "12vh"
          }}
        >
          <div 
            className="search-modal-content liquid-glass-panel" 
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "600px",
              maxWidth: "90%",
              background: "var(--search-bg)",
              border: "1px solid var(--search-border)",
              borderRadius: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              boxSizing: "border-box"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid var(--search-border)", paddingBottom: "12px" }}>
              <SearchIcon size={20} style={{ color: "var(--sidebar-text-color)" }} />
              <input
                ref={popupInputRef}
                type="text"
                placeholder="Type to search farms, diseases, or services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: "16px",
                  color: "var(--search-text)"
                }}
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                style={{
                  background: "rgba(0, 0, 0, 0.05)",
                  border: "none",
                  borderRadius: "8px",
                  padding: "4px 8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  color: "var(--sidebar-text-color)"
                }}
              >
                ESC
              </button>
            </div>

            <div style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredItems.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", color: "var(--sidebar-text-color)", fontSize: "14px", fontStyle: "italic" }}>
                  No results found for "{searchQuery}"
                </div>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.title}
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigate(item.route);
                    }}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "12px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      transition: "all 0.2s",
                      border: "1px solid transparent"
                    }}
                    className="search-result-item"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--search-text)" }}>{item.title}</span>
                      <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "6px", background: "rgba(47, 184, 107, 0.12)", color: "#1D7A46", fontWeight: 700 }}>
                        {item.category}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--sidebar-text-color)" }}>{item.description}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .search-result-item:hover {
          background: rgba(47, 184, 107, 0.08) !important;
          border-color: rgba(47, 184, 107, 0.15) !important;
        }
      `}</style>
    </>
  );
};

export default Navbar;
