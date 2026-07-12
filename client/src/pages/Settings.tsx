import React, { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { useSelector, useDispatch } from "react-redux";
import { uiAction } from "../store/ui";

const Settings: React.FC = () => {
  const { farmer } = useAuth();
  const dispatch = useDispatch();
  const isDarkRedux = useSelector((state: any) => state.ui.isDark);
  
  const [theme, setTheme] = useState<string>(() => localStorage.getItem("theme") || "light");
  const [notifyWeather, setNotifyWeather] = useState(true);
  const [notifyDisease, setNotifyDisease] = useState(true);
  const [notifyMarket, setNotifyMarket] = useState(true);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Sync state with localstorage
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    // Sync redux if needed
    if ((theme === "dark") !== isDarkRedux) {
      dispatch(uiAction.toggleTheme());
    }
  }, [theme, dispatch, isDarkRedux]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }

    setUpdatingPassword(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("http://localhost:5001/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || "Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error changing password. Please try again.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleDownloadData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      user: farmer,
      downloadedAt: new Date().toISOString(),
      platform: "IntelliFarm AI"
    }, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `intellifarm-data-${farmer?.email || "user"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("Profile data downloaded successfully!");
  };

  const handleExportReports = async () => {
    toast.success("Preparing reports export...");
    // Mock export download
    const csvContent = "data:text/csv;charset=utf-8,Date,Type,Details,Severity\n" +
      `${new Date().toLocaleDateString()},Alert,Weather Update,Low\n` +
      `${new Date().toLocaleDateString()},Disease,Tomato Blight Detected,High\n`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", encodeURI(csvContent));
    downloadAnchor.setAttribute("download", "intellifarm-reports.csv");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDeleteAccount = () => {
    const confirmDelete = window.confirm(
      "WARNING: Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone."
    );
    if (confirmDelete) {
      const confirmEmail = window.prompt(`Please type your email (${farmer?.email}) to confirm account deletion:`);
      if (confirmEmail === farmer?.email) {
        toast.error("Account deletion is simulated in demo environment.");
      } else {
        toast.error("Email confirmation mismatched. Account not deleted.");
      }
    }
  };

  return (
    <MainLayout
      eyebrow="Application Configuration"
      title="Settings"
      subtitle="Manage your platform preferences, account security, and data privacy"
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", width: "100%" }}>
        
        {/* Left column: Theme & Notifications */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Theme card */}
          <div className="liquid-glass-panel" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "16px", color: "var(--body-color)" }}>Theme Preferences</h2>
            <p style={{ fontSize: "14px", color: "var(--text-main, #5b6b62)", marginBottom: "20px" }}>
              Select how IntelliFarm AI looks on your device.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className={`glass-btn-${theme === "dark" ? "primary" : "secondary"}`}
                style={{ flex: 1, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                onClick={() => setTheme("dark")}
              >
                <span>🌙</span> Dark Mode
              </button>
              <button
                className={`glass-btn-${theme === "light" ? "primary" : "secondary"}`}
                style={{ flex: 1, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                onClick={() => setTheme("light")}
              >
                <span>☀️</span> Light Mode
              </button>
            </div>
          </div>

          {/* Notifications config card */}
          <div className="liquid-glass-panel" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "16px", color: "var(--body-color)" }}>Notification Preferences</h2>
            <p style={{ fontSize: "14px", color: "var(--text-main, #5b6b62)", marginBottom: "20px" }}>
              Enable alerts for updates that impact your field activities.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "14px" }}>Weather Bulletins</span>
                  <span style={{ fontSize: "12px", color: "#8e918f" }}>Storm alerts, heavy rainfall notices</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWeather}
                  onChange={(e) => setNotifyWeather(e.target.checked)}
                  style={{ width: "20px", height: "20px", accentColor: "#2e7d32" }}
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "14px" }}>Disease Warnings</span>
                  <span style={{ fontSize: "12px", color: "#8e918f" }}>Local pest outbreak updates</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDisease}
                  onChange={(e) => setNotifyDisease(e.target.checked)}
                  style={{ width: "20px", height: "20px", accentColor: "#2e7d32" }}
                />
              </label>

              <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                <div>
                  <span style={{ fontWeight: 600, display: "block", fontSize: "14px" }}>Market Fluctuations</span>
                  <span style={{ fontSize: "12px", color: "#8e918f" }}>Starred crops major price swings</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyMarket}
                  onChange={(e) => setNotifyMarket(e.target.checked)}
                  style={{ width: "20px", height: "20px", accentColor: "#2e7d32" }}
                />
              </label>
            </div>
          </div>

          {/* Data & Privacy */}
          <div className="liquid-glass-panel" style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "16px", color: "var(--body-color)" }}>Data & Privacy</h2>
            <p style={{ fontSize: "14px", color: "var(--text-main, #5b6b62)", marginBottom: "20px" }}>
              Download, export, or permanently remove your account information.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                className="glass-btn-secondary"
                style={{ padding: "10px", textAlign: "left", display: "flex", justifyContent: "space-between", width: "100%" }}
                onClick={handleDownloadData}
              >
                <span>Download My Data (JSON)</span>
                <span>📥</span>
              </button>
              <button
                className="glass-btn-secondary"
                style={{ padding: "10px", textAlign: "left", display: "flex", justifyContent: "space-between", width: "100%" }}
                onClick={handleExportReports}
              >
                <span>Export Reports (CSV)</span>
                <span>📊</span>
              </button>
              <button
                className="glass-btn-secondary"
                style={{
                  padding: "10px",
                  textAlign: "left",
                  display: "flex",
                  justifyContent: "space-between",
                  width: "100%",
                  color: "#d32f2f",
                  borderColor: "rgba(211, 47, 47, 0.25)"
                }}
                onClick={handleDeleteAccount}
              >
                <span>Delete Account</span>
                <span>⚠️</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right column: Security (Password Change) */}
        <div>
          <form className="liquid-glass-panel" onSubmit={handlePasswordChange} style={{ padding: "24px" }}>
            <h2 style={{ fontSize: "18px", marginBottom: "16px", color: "var(--body-color)" }}>Account Security</h2>
            <p style={{ fontSize: "14px", color: "var(--text-main, #5b6b62)", marginBottom: "20px" }}>
              Change your password below. Make sure it has at least 8 characters and includes uppercase, lowercase, numbers, and special characters.
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Current Password</label>
                <input
                  type="password"
                  className="liquid-glass-input"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>New Password</label>
                <input
                  type="password"
                  className="liquid-glass-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600 }}>Confirm New Password</label>
                <input
                  type="password"
                  className="liquid-glass-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="glass-btn-primary"
              style={{ width: "100%", padding: "12px" }}
              disabled={updatingPassword}
            >
              {updatingPassword ? "Updating Password..." : "Update Password"}
            </button>
          </form>
        </div>

      </div>
    </MainLayout>
  );
};

export default Settings;
