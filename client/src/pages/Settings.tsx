import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import {
  Monitor,
  Sun,
  Moon,
  Sparkles,
  Download,
  FileSpreadsheet,
  Upload,
  FileText,
  TriangleAlert,
  ChevronRight,
  ShieldCheck,
  Check
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { uiAction } from "../store/ui";

const Settings: React.FC = () => {
  const { farmer } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isDarkRedux = useSelector((state: any) => state.ui.isDark);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Appearance Theme State (system, light, dark)
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") || "system");

  // Spryzen AI Preferences State
  const [aiPrefs, setAiPrefs] = useState<{
    smartRecs: boolean;
    diseaseFollowup: boolean;
    farmInsights: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem("spryzen_ai_prefs");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      smartRecs: true,
      diseaseFollowup: true,
      farmInsights: true,
    };
  });

  // Privacy Policy Modal State
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Sync theme with DOM, localStorage, and Redux
  useEffect(() => {
    let activeTheme = theme;
    if (theme === "system") {
      activeTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    document.documentElement.setAttribute("data-theme", activeTheme);
    localStorage.setItem("theme", theme);

    if ((activeTheme === "dark") !== isDarkRedux) {
      dispatch(uiAction.toggleTheme());
    }
  }, [theme, dispatch, isDarkRedux]);

  // Handle system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", newTheme);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Save AI preferences to local storage
  const toggleAiPref = (key: keyof typeof aiPrefs) => {
    setAiPrefs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("spryzen_ai_prefs", JSON.stringify(updated));
      toast.success("AI preferences updated", { id: "ai-pref-toast" });
      return updated;
    });
  };

  // Actions
  const handleDownloadJSON = () => {
    const dataObj = {
      user: {
        name: farmer?.name || "Farmer",
        email: farmer?.email || "",
        location: farmer?.location || "",
        pincode: farmer?.pincode || "",
        farmSize: farmer?.farmSize || "",
        cropsInterested: farmer?.cropsInterested || []
      },
      aiPreferences: aiPrefs,
      exportTimestamp: new Date().toISOString(),
      platform: "IntelliFarm AI"
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataObj, null, 2));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `intellifarm-account-${farmer?.email || "data"}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    toast.success("JSON data downloaded successfully!");
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Field,Value\n" +
      `"Name","${farmer?.name || "Farmer"}"\n` +
      `"Email","${farmer?.email || ""}"\n` +
      `"Location","${farmer?.location || ""}"\n` +
      `"Pincode","${farmer?.pincode || ""}"\n` +
      `"Farm Size","${farmer?.farmSize || ""}"\n` +
      `"Export Date","${new Date().toLocaleDateString()}"\n`;

    const anchor = document.createElement("a");
    anchor.setAttribute("href", encodeURI(csvContent));
    anchor.setAttribute("download", `intellifarm-profile-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    toast.success("CSV report exported successfully!");
  };

  const handleImportBackup = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed?.aiPreferences) {
          setAiPrefs(parsed.aiPreferences);
          localStorage.setItem("spryzen_ai_prefs", JSON.stringify(parsed.aiPreferences));
        }
        toast.success(`Backup file "${file.name}" imported successfully!`);
      } catch (err) {
        toast.error("Invalid JSON backup file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
      "WARNING: Are you sure you want to delete your account? All farm records, crop advisories, and history will be permanently deleted."
    );
    if (!confirmDelete) return;

    const confirmEmail = window.prompt(`Please type your account email (${farmer?.email || "your email"}) to confirm deletion:`);
    if (confirmEmail === (farmer?.email || "")) {
      toast.error("Account deletion is restricted in demo mode.", { duration: 4000 });
    } else {
      toast.error("Email confirmation did not match. Account deletion cancelled.");
    }
  };

  const initialLetter = farmer?.name
    ? farmer.name.charAt(0).toUpperCase()
    : farmer?.email
    ? farmer.email.charAt(0).toUpperCase()
    : "S";

  return (
    <MainLayout
      eyebrow=""
      title="Account & Preferences"
      subtitle="Customize your IntelliFarm AI experience and manage your account."
    >
      <div className="settings-page-wrapper">
        
        {/* Hidden File Input for Backup Import */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          style={{ display: "none" }}
        />

        {/* 1. Large Profile Glass Card */}
        <div className="settings-card settings-card-profile">
          <div className="settings-profile-left">
            <div className="settings-avatar">
              {initialLetter}
            </div>
            <div className="settings-profile-details">
              <h2 className="settings-profile-name">
                {farmer?.name || "Sreevanth Vadlamudi"}
              </h2>
              <span className="settings-profile-role">Farmer</span>
            </div>
          </div>
          <button
            type="button"
            className="settings-btn-edit-profile"
            onClick={() => navigate("/profile")}
          >
            <span>Edit Profile</span>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Preferences Grid (2-column on desktop, 1-column on mobile) */}
        <div className="settings-grid">
          
          {/* 2. Appearance */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon-badge settings-badge-appearance">
                <Sun size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Appearance</h3>
                <p className="settings-card-sub">Select your theme preference for IntelliFarm AI.</p>
              </div>
            </div>

            <div className="settings-segmented-control">
              <button
                type="button"
                className={`settings-segmented-btn ${theme === "system" ? "active" : ""}`}
                onClick={() => setTheme("system")}
              >
                <Monitor size={16} />
                <span>System</span>
              </button>
              <button
                type="button"
                className={`settings-segmented-btn ${theme === "light" ? "active" : ""}`}
                onClick={() => setTheme("light")}
              >
                <Sun size={16} />
                <span>Light</span>
              </button>
              <button
                type="button"
                className={`settings-segmented-btn ${theme === "dark" ? "active" : ""}`}
                onClick={() => setTheme("dark")}
              >
                <Moon size={16} />
                <span>Dark</span>
              </button>
            </div>
          </div>

          {/* 3. Spryzen AI Preferences */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon-badge settings-badge-ai">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Spryzen AI</h3>
                <p className="settings-card-sub">Configure intelligent agricultural advisory features.</p>
              </div>
            </div>

            <div className="settings-toggle-list">
              <label className="settings-toggle-item">
                <div className="settings-toggle-info">
                  <strong>Enable Smart Recommendations</strong>
                  <span>Automatic weather & fertilizer suggestions for your crops</span>
                </div>
                <input
                  type="checkbox"
                  checked={aiPrefs.smartRecs}
                  onChange={() => toggleAiPref("smartRecs")}
                  className="settings-checkbox"
                />
              </label>

              <label className="settings-toggle-item">
                <div className="settings-toggle-info">
                  <strong>Disease Follow-up Suggestions</strong>
                  <span>Follow-up treatment checklists after disease scanning</span>
                </div>
                <input
                  type="checkbox"
                  checked={aiPrefs.diseaseFollowup}
                  onChange={() => toggleAiPref("diseaseFollowup")}
                  className="settings-checkbox"
                />
              </label>

              <label className="settings-toggle-item">
                <div className="settings-toggle-info">
                  <strong>Personalized Farm Insights</strong>
                  <span>Use your saved farm location and soil context in AI responses</span>
                </div>
                <input
                  type="checkbox"
                  checked={aiPrefs.farmInsights}
                  onChange={() => toggleAiPref("farmInsights")}
                  className="settings-checkbox"
                />
              </label>
            </div>
          </div>

          {/* 4. Privacy & Data */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-icon-badge settings-badge-privacy">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Privacy & Data</h3>
                <p className="settings-card-sub">Manage your account data downloads and privacy rights.</p>
              </div>
            </div>

            <div className="settings-actions-grid">
              <button
                type="button"
                className="settings-outline-btn"
                onClick={handleDownloadJSON}
              >
                <Download size={16} />
                <span>Download JSON</span>
              </button>

              <button
                type="button"
                className="settings-outline-btn"
                onClick={handleExportCSV}
              >
                <FileSpreadsheet size={16} />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                className="settings-outline-btn"
                onClick={handleImportBackup}
              >
                <Upload size={16} />
                <span>Import Backup</span>
              </button>

              <button
                type="button"
                className="settings-outline-btn"
                onClick={() => setShowPrivacyModal(true)}
              >
                <FileText size={16} />
                <span>Privacy Policy</span>
              </button>
            </div>
          </div>

          {/* 5. Danger Zone */}
          <div className="settings-card settings-card-danger">
            <div className="settings-card-header">
              <div className="settings-icon-badge settings-badge-danger">
                <TriangleAlert size={20} />
              </div>
              <div>
                <h3 className="settings-card-title settings-title-danger">Danger Zone</h3>
                <p className="settings-card-sub">Permanent account actions that cannot be reversed.</p>
              </div>
            </div>

            <div className="settings-danger-body">
              <p className="settings-danger-text">
                Deleting your account will remove all registered farm fields, AI diagnostic reports, and personal settings permanently.
              </p>
              <button
                type="button"
                className="settings-btn-danger"
                onClick={handleDeleteAccount}
              >
                <TriangleAlert size={16} />
                <span>Delete Account</span>
              </button>
            </div>
          </div>

        </div>

        {/* Privacy Policy Modal */}
        {showPrivacyModal && (
          <div className="settings-modal-backdrop" onClick={() => setShowPrivacyModal(false)}>
            <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-icon-badge settings-badge-privacy">
                  <ShieldCheck size={20} />
                </div>
                <h3>IntelliFarm AI Privacy Policy</h3>
              </div>
              <div className="settings-modal-body">
                <p>
                  IntelliFarm AI is committed to safeguarding your agricultural data and personal information.
                </p>
                <ul>
                  <li><strong>Data Ownership:</strong> You retain full ownership of all farm data, crop logs, and diagnostic images.</li>
                  <li><strong>AI Processing:</strong> Diagnostic images are processed securely to provide real-time disease detection and treatment recommendations.</li>
                  <li><strong>Security:</strong> All user communications are encrypted via SSL/TLS protocol.</li>
                </ul>
              </div>
              <div className="settings-modal-footer">
                <button
                  type="button"
                  className="settings-btn-modal-close"
                  onClick={() => setShowPrivacyModal(false)}
                >
                  <Check size={16} /> Close Privacy Policy
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Glassmorphism Styling Matching Disease Detection & Weather Pages ── */}
      <style>{`
        .settings-page-wrapper {
          display: flex;
          flex-direction: column;
          gap: 28px;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 8px 60px;
          width: 100%;
          box-sizing: border-box;
        }

        /* Generic Glassmorphism Card Style matching Disease Detection */
        .settings-card {
          background: var(--settings-card-bg, rgba(255, 255, 255, 0.85));
          border: 1px solid var(--settings-card-border, rgba(46, 125, 50, 0.14));
          border-radius: 24px;
          padding: 28px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;
          animation: settingsFadeSlide 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        [data-theme="dark"] .settings-card {
          background: rgba(18, 30, 22, 0.85);
          border-color: rgba(74, 222, 128, 0.16);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        }

        @keyframes settingsFadeSlide {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* 1. Profile Glass Card */
        .settings-card-profile {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 24px 32px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(244, 249, 245, 0.85) 100%);
        }

        [data-theme="dark"] .settings-card-profile {
          background: linear-gradient(135deg, rgba(24, 40, 29, 0.92) 0%, rgba(16, 28, 20, 0.85) 100%);
        }

        .settings-profile-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .settings-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2e7d32, #10b981);
          color: #ffffff;
          font-size: 26px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(46, 125, 50, 0.3);
          flex-shrink: 0;
        }

        .settings-profile-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .settings-profile-name {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: var(--body-color, #183d24);
          letter-spacing: -0.4px;
        }

        [data-theme="dark"] .settings-profile-name {
          color: #f0fdf4;
        }

        .settings-profile-role {
          font-size: 14px;
          font-weight: 600;
          color: #2e7d32;
        }

        [data-theme="dark"] .settings-profile-role {
          color: #4ade80;
        }

        .settings-btn-edit-profile {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 14px;
          background: rgba(46, 125, 50, 0.08);
          color: #2e7d32;
          border: 1.5px solid rgba(46, 125, 50, 0.2);
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
        }

        [data-theme="dark"] .settings-btn-edit-profile {
          background: rgba(74, 222, 128, 0.1);
          color: #4ade80;
          border-color: rgba(74, 222, 128, 0.25);
        }

        .settings-btn-edit-profile:hover {
          transform: scale(1.02);
          background: rgba(46, 125, 50, 0.15);
          box-shadow: 0 4px 14px rgba(46, 125, 50, 0.15);
        }

        /* 2-Column Desktop Grid */
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          width: 100%;
        }

        /* Card Header */
        .settings-card-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 22px;
        }

        .settings-icon-badge {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .settings-badge-appearance {
          background: rgba(245, 158, 11, 0.12);
          color: #f59e0b;
        }

        .settings-badge-ai {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }

        .settings-badge-privacy {
          background: rgba(2, 132, 199, 0.12);
          color: #0284c7;
        }

        .settings-badge-danger {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }

        .settings-card-title {
          margin: 0 0 3px;
          font-size: 18px;
          font-weight: 800;
          color: var(--body-color, #183d24);
          letter-spacing: -0.3px;
        }

        [data-theme="dark"] .settings-card-title {
          color: #f0fdf4;
        }

        .settings-title-danger {
          color: #dc2626 !important;
        }

        [data-theme="dark"] .settings-title-danger {
          color: #f87171 !important;
        }

        .settings-card-sub {
          margin: 0;
          font-size: 13px;
          color: var(--text-main, #5b6b62);
          line-height: 1.45;
        }

        /* Segmented Buttons for Theme (macOS style, Lucide icons, no emojis) */
        .settings-segmented-control {
          display: flex;
          background: rgba(0, 0, 0, 0.04);
          border-radius: 16px;
          padding: 5px;
          gap: 4px;
          border: 1px solid rgba(0, 0, 0, 0.05);
        }

        [data-theme="dark"] .settings-segmented-control {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.08);
        }

        .settings-segmented-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 14px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: var(--text-main, #5b6b62);
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .settings-segmented-btn:hover {
          color: var(--body-color, #183d24);
        }

        .settings-segmented-btn.active {
          background: #ffffff;
          color: #2e7d32;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
          font-weight: 800;
        }

        [data-theme="dark"] .settings-segmented-btn.active {
          background: rgba(30, 48, 36, 0.95);
          color: #4ade80;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
        }

        /* Toggle Checkbox Items */
        .settings-toggle-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .settings-toggle-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        [data-theme="dark"] .settings-toggle-item {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
        }

        .settings-toggle-item:hover {
          background: rgba(46, 125, 50, 0.04);
          border-color: rgba(46, 125, 50, 0.15);
        }

        .settings-toggle-info {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding-right: 12px;
        }

        .settings-toggle-info strong {
          font-size: 13.5px;
          font-weight: 700;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .settings-toggle-info strong {
          color: #f0fdf4;
        }

        .settings-toggle-info span {
          font-size: 12px;
          color: var(--text-main, #6b7c72);
        }

        .settings-checkbox {
          width: 20px;
          height: 20px;
          accent-color: #2e7d32;
          cursor: pointer;
          flex-shrink: 0;
        }

        /* Compact Outline Actions for Privacy & Data */
        .settings-actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .settings-outline-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1.5px solid var(--settings-card-border, rgba(46, 125, 50, 0.2));
          background: transparent;
          color: var(--body-color, #183d24);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        [data-theme="dark"] .settings-outline-btn {
          color: #f0fdf4;
          border-color: rgba(74, 222, 128, 0.2);
        }

        .settings-outline-btn:hover {
          transform: scale(1.02);
          border-color: #2e7d32;
          background: rgba(46, 125, 50, 0.06);
          box-shadow: 0 4px 12px rgba(46, 125, 50, 0.12);
        }

        /* Danger Zone Card */
        .settings-card-danger {
          border-color: rgba(239, 68, 68, 0.25);
          background: linear-gradient(135deg, rgba(254, 242, 242, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%);
        }

        [data-theme="dark"] .settings-card-danger {
          border-color: rgba(239, 68, 68, 0.3);
          background: linear-gradient(135deg, rgba(40, 16, 16, 0.85) 0%, rgba(24, 14, 14, 0.9) 100%);
        }

        .settings-danger-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .settings-danger-text {
          margin: 0;
          font-size: 13px;
          line-height: 1.5;
          color: #991b1b;
        }

        [data-theme="dark"] .settings-danger-text {
          color: #fca5a5;
        }

        .settings-btn-danger {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 13px;
          border-radius: 14px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: #ffffff;
          border: none;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.25);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
        }

        .settings-btn-danger:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 18px rgba(239, 68, 68, 0.35);
        }

        /* Modal styling */
        .settings-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999;
          padding: 16px;
        }

        .settings-modal-card {
          background: var(--settings-card-bg, #ffffff);
          border: 1px solid var(--settings-card-border, rgba(46, 125, 50, 0.2));
          border-radius: 24px;
          padding: 28px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        [data-theme="dark"] .settings-modal-card {
          background: #121e16;
          color: #f0fdf4;
        }

        .settings-modal-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .settings-modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
        }

        .settings-modal-body p {
          font-size: 13.5px;
          line-height: 1.5;
          margin: 0 0 12px;
        }

        .settings-modal-body ul {
          margin: 0;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 13px;
          line-height: 1.45;
        }

        .settings-modal-footer {
          margin-top: 8px;
        }

        .settings-btn-modal-close {
          width: 100%;
          padding: 12px;
          border-radius: 14px;
          background: #2e7d32;
          color: #ffffff;
          border: none;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        /* Responsive Layout Adjustments for Tablet and Mobile */
        @media (max-width: 850px) {
          .settings-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .settings-card-profile {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .settings-btn-edit-profile {
            width: 100%;
            justify-content: center;
          }

          .settings-actions-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default Settings;
