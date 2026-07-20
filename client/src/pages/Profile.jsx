import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  Camera, MapPin, User, Mail, LogOut,
  AlertTriangle, CheckCircle, Monitor, Smartphone, Sparkles
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { fetchProfile, updateProfile } from "../services/profileApi";

const Profile = () => {
  const { farmer, applySession, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  // Edit Profile form state
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [pincode, setPincode] = useState("");
  const [location, setLocation] = useState("");
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [profileImg, setProfileImg] = useState("");

  const availableCrops = ["Paddy", "Tomato", "Maize", "Wheat", "Cotton", "Soybean", "Potato", "Chilli", "Sugarcane", "Groundnut"];

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await fetchProfile();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setName(data.profile.name || farmer?.name || "");
        setLocation(data.profile.location || farmer?.location || "");
        setPincode(data.profile.pincode || farmer?.pincode || "");
        setSelectedCrops(data.profile.cropsInterested || farmer?.cropsInterested || []);
        setProfileImg(data.profile.profileImg || farmer?.profileImg || "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      const user = farmer || {};
      setName(user.name || "");
      setLocation(user.location || "");
      setPincode(user.pincode || "");
      setSelectedCrops(user.cropsInterested || []);
      setProfileImg(user.profileImg || "");
    }
  }, [farmer]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Strict Profile Completion calculation:
  // Name: 25%, Pincode: 25%, Location: 25%, At least 1 Crop: 25% = 100%
  const calculateCompletion = () => {
    let score = 0;
    if (name && name.trim()) score += 25;
    if (pincode && pincode.trim()) score += 25;
    if (location && location.trim()) score += 25;
    if (selectedCrops && selectedCrops.length > 0) score += 25;
    return score;
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be smaller than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        setProfileImg(base64);
        try {
          const { data } = await updateProfile({ profileImg: base64 });
          if (data.success) {
            toast.success("Profile photo updated!");
            applySession(data.user);
          }
        } catch (err) {
          toast.error("Failed to upload photo");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!pincode || !pincode.trim()) {
      toast.error("Please enter your 6-digit Pincode.");
      return;
    }

    if (!selectedCrops || selectedCrops.length === 0) {
      toast.error("Please select at least 1 crop of interest.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await updateProfile({
        name: name.trim(),
        pincode: pincode.trim(),
        location: location.trim(),
        cropsInterested: selectedCrops
      });
      if (data.success) {
        toast.success("Profile updated successfully!");
        setProfile(data.user);
        applySession(data.user);
        setEditMode(false);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCropToggle = (crop) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm("Are you sure you want to log out from all devices?")) return;
    try {
      if (logout) await logout();
      toast.success("Logged out from all device sessions.");
      navigate("/login");
    } catch (err) {
      toast.error("Logout failed. Redirecting to login...");
      navigate("/login");
    }
  };

  const currentFarmer = profile || farmer || {};
  const completionPercent = calculateCompletion();
  const isProfileIncomplete = completionPercent < 100;

  // Active sessions without IP addresses
  const activeSessions = [
    { device: "Chrome Web Browser (Current Session)", status: "Active Now", icon: Monitor },
    { device: "IntelliFarm Mobile App", status: "Active 2 hours ago", icon: Smartphone }
  ];

  return (
    <MainLayout eyebrow="" title="" subtitle="">
      <div className="profile-container">

        {/* ── Complete Profile Banner (Shown if Pincode or Crops missing) ── */}
        {isProfileIncomplete && (
          <div className="profile-alert-banner">
            <div className="profile-alert-content">
              <AlertTriangle size={24} className="profile-alert-icon" />
              <div>
                <strong className="profile-alert-title">Profile Setup Incomplete ({completionPercent}%)</strong>
                <p className="profile-alert-desc">
                  {!pincode?.trim() ? "Pincode is missing. " : ""}
                  {selectedCrops.length === 0 ? "Select at least 1 crop of interest. " : ""}
                  Provide all details so IntelliFarm AI & Spryzen can accurately personalize weather, farm recommendations, and disease advisories.
                </p>
              </div>
            </div>
            <button className="profile-alert-btn" onClick={() => setEditMode(true)}>
              Complete Profile
            </button>
          </div>
        )}

        <div className="profile-main-grid">

          {/* ── Left Column: Avatar & Summary ── */}
          <div className="profile-col-left">

            {/* Avatar Panel */}
            <div className="profile-panel profile-avatar-panel">
              <div className="profile-avatar-wrapper">
                <img
                  src={profileImg || currentFarmer.profileImg || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || "Farmer")}`}
                  alt="Farmer Profile"
                  className="profile-avatar-img"
                />
                <label htmlFor="avatar-upload" className="profile-avatar-upload-btn" title="Change profile photo">
                  <Camera size={16} />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
              </div>

              <div className="profile-user-info">
                <h2 className="profile-user-name">{currentFarmer.name || "Farmer Profile"}</h2>
                <span className="profile-user-email">{currentFarmer.email}</span>
              </div>

              {/* Profile Completion Bar */}
              <div className="profile-completion-box">
                <div className="profile-completion-header">
                  <span>Profile Setup</span>
                  <span className="profile-completion-pct">{completionPercent}%</span>
                </div>
                <div className="profile-completion-track">
                  <div
                    className="profile-completion-fill"
                    style={{ width: `${completionPercent}%` }}
                  />
                </div>
              </div>

              <div className="profile-divider" />

              {/* Saved Details List */}
              <div className="profile-summary-list">
                <div className="profile-summary-item">
                  <span className="profile-summary-label">
                    <MapPin size={14} /> Pincode
                  </span>
                  <strong className="profile-summary-val">
                    {pincode || currentFarmer.pincode || "Not Set"}
                  </strong>
                </div>

                <div className="profile-summary-item">
                  <span className="profile-summary-label">
                    <MapPin size={14} /> Farm Area / Location
                  </span>
                  <strong className="profile-summary-val">
                    {location || currentFarmer.location || "Not Set"}
                  </strong>
                </div>

                <div className="profile-summary-item">
                  <span className="profile-summary-label">
                    <Sparkles size={14} /> Crops of Interest
                  </span>
                  <div className="profile-crop-tags">
                    {selectedCrops.length > 0 ? (
                      selectedCrops.map((crop) => (
                        <span key={crop} className="profile-crop-tag">{crop}</span>
                      ))
                    ) : (
                      <span className="profile-no-tags">No crops selected (At least 1 required)</span>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── Right Column: Settings & Sessions ── */}
          <div className="profile-col-right">

            {/* Farming Profile Details Form */}
            <div className="profile-panel">
              <div className="profile-panel-header">
                <div>
                  <h2 className="profile-panel-title">Personal Information & Location</h2>
                  <p className="profile-panel-sub">Enter your Pincode and Farm Area for personalized IntelliFarm AI alerts.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditMode(!editMode)}
                  className="profile-edit-toggle-btn"
                >
                  {editMode ? "Cancel" : "Edit Profile"}
                </button>
              </div>

              {!editMode ? (
                <div className="profile-details-grid">
                  <div className="profile-detail-card">
                    <span className="profile-detail-label"><User size={13} /> Full Name</span>
                    <strong className="profile-detail-val">{currentFarmer.name || "N/A"}</strong>
                  </div>
                  <div className="profile-detail-card">
                    <span className="profile-detail-label"><Mail size={13} /> Email Address</span>
                    <strong className="profile-detail-val">{currentFarmer.email || "N/A"}</strong>
                  </div>
                  <div className="profile-detail-card">
                    <span className="profile-detail-label"><MapPin size={13} /> Pincode *</span>
                    <strong className="profile-detail-val">{pincode || currentFarmer.pincode || "Not Set"}</strong>
                  </div>
                  <div className="profile-detail-card">
                    <span className="profile-detail-label"><MapPin size={13} /> Farm Area / Location</span>
                    <strong className="profile-detail-val">{location || currentFarmer.location || "Not Set"}</strong>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="profile-edit-form">
                  <div className="profile-form-two-col">

                    <div className="profile-field-group">
                      <label className="profile-field-label">Full Name *</label>
                      <input
                        type="text"
                        className="profile-field-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>

                    <div className="profile-field-group">
                      <label className="profile-field-label">Pincode (Postal Code) *</label>
                      <input
                        type="text"
                        maxLength={10}
                        className="profile-field-input"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="e.g. 522002"
                        required
                      />
                    </div>

                    <div className="profile-field-group profile-span-2">
                      <label className="profile-field-label">Farm Area / Town / District</label>
                      <input
                        type="text"
                        className="profile-field-input"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. North Field, Guntur"
                      />
                    </div>

                  </div>

                  {/* Crops of Interest (Mandatory: At least 1) */}
                  <div className="profile-field-group">
                    <label className="profile-field-label">
                      Crops of Interest * <span style={{ textTransform: "none", fontWeight: 400, color: "#ef4444" }}>(Select at least 1)</span>
                    </label>
                    <div className="profile-crop-selector-grid">
                      {availableCrops.map((crop) => {
                        const active = selectedCrops.includes(crop);
                        return (
                          <button
                            key={crop}
                            type="button"
                            onClick={() => handleCropToggle(crop)}
                            className={`profile-crop-btn ${active ? "profile-crop-btn-active" : ""}`}
                          >
                            {active && <CheckCircle size={13} />}
                            {crop}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="profile-form-actions">
                    <button
                      type="submit"
                      className="profile-save-btn"
                      disabled={loading}
                    >
                      {loading ? "Saving Profile..." : "Save Profile Details"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Active Device Sessions List */}
            <div className="profile-panel">
              <div className="profile-panel-header">
                <div>
                  <h2 className="profile-panel-title">Active Device Sessions</h2>
                  <p className="profile-panel-sub">Manage active logins across your devices.</p>
                </div>
              </div>

              <div className="profile-sessions-list">
                {activeSessions.map((session, index) => {
                  const Icon = session.icon;
                  return (
                    <div key={index} className="profile-session-card">
                      <div className="profile-session-left">
                        <Icon size={20} className="profile-session-icon" />
                        <div>
                          <strong className="profile-session-device">{session.device}</strong>
                          <span className="profile-session-status">{session.status}</span>
                        </div>
                      </div>
                      <span className="profile-session-badge">
                        {session.status === "Active Now" ? "Current" : "Logged"}
                      </span>
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="profile-logout-all-btn"
                  onClick={handleLogoutAllDevices}
                >
                  <LogOut size={16} /> Log Out From All Devices
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ── Responsive Profile CSS ── */}
      <style>{`
        .profile-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: clamp(16px, 3vw, 24px);
          padding: 0 16px 60px;
          box-sizing: border-box;
          width: 100%;
        }

        /* Alert Banner */
        .profile-alert-banner {
          background: rgba(245, 158, 11, 0.1);
          border: 1.5px solid rgba(245, 158, 11, 0.3);
          border-radius: 18px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .profile-alert-content {
          display: flex;
          align-items: center;
          gap: 14px;
          flex: 1;
          min-width: 260px;
        }
        .profile-alert-icon {
          color: #f59e0b;
          flex-shrink: 0;
        }
        .profile-alert-title {
          font-size: 15px;
          font-weight: 800;
          color: var(--body-color);
          display: block;
        }
        .profile-alert-desc {
          font-size: 13px;
          color: var(--text-main, #4b5563);
          margin: 2px 0 0;
          line-height: 1.4;
        }
        .profile-alert-btn {
          background: #f59e0b;
          color: #fff;
          border: none;
          border-radius: 12px;
          padding: 10px 18px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .profile-alert-btn:hover { background: #d97706; transform: translateY(-1px); }

        /* Main Grid Layout */
        .profile-main-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: clamp(16px, 3vw, 24px);
          align-items: start;
          width: 100%;
        }
        @media (max-width: 900px) {
          .profile-main-grid {
            grid-template-columns: 1fr;
          }
        }

        .profile-col-left {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .profile-col-right {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Panels */
        .profile-panel {
          background: var(--glass-bg, rgba(255,255,255,0.72));
          border: 1px solid var(--glass-border, rgba(46,125,50,0.15));
          border-radius: 24px;
          padding: clamp(16px, 3vw, 24px);
          box-shadow: var(--glass-shadow, 0 8px 32px rgba(46,125,50,0.06));
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-sizing: border-box;
          width: 100%;
        }
        [data-theme="dark"] .profile-panel {
          background: rgba(20, 32, 24, 0.72);
        }

        .profile-avatar-panel {
          align-items: center;
          text-align: center;
        }

        /* Avatar */
        .profile-avatar-wrapper {
          position: relative;
          display: inline-block;
        }
        .profile-avatar-img {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          object-fit: cover;
          border: 3.5px solid #2e7d32;
          box-shadow: 0 8px 24px rgba(46,125,50,0.2);
        }
        .profile-avatar-upload-btn {
          position: absolute;
          bottom: 2px;
          right: 2px;
          background: linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%);
          color: #fff;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          border: 2px solid #fff;
          transition: transform 0.2s;
        }
        .profile-avatar-upload-btn:hover { transform: scale(1.1); }

        .profile-user-info { display: flex; flex-direction: column; gap: 4px; }
        .profile-user-name { font-size: 20px; font-weight: 800; color: var(--body-color); margin: 0; word-break: break-word; }
        .profile-user-email { font-size: 13px; color: var(--text-main, #6b7c72); font-weight: 500; word-break: break-all; }

        /* Completion Bar */
        .profile-completion-box { width: 100%; text-align: left; }
        .profile-completion-header { display: flex; justify-content: space-between; font-size: 12.5px; font-weight: 700; color: var(--body-color); margin-bottom: 6px; }
        .profile-completion-pct { color: #2e7d32; }
        .profile-completion-track { width: 100%; height: 8px; background: rgba(46,125,50,0.1); border-radius: 99px; overflow: hidden; }
        .profile-completion-fill { height: 100%; background: linear-gradient(90deg, #2e7d32, #10b981); border-radius: 99px; transition: width 0.4s ease; }

        .profile-divider { width: 100%; height: 1px; background: var(--glass-border, rgba(0,0,0,0.06)); }

        .profile-summary-list { width: 100%; display: flex; flex-direction: column; gap: 14px; text-align: left; }
        .profile-summary-item { display: flex; flex-direction: column; gap: 4px; }
        .profile-summary-label { font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: var(--text-main, #6b7c72); display: flex; align-items: center; gap: 6px; }
        .profile-summary-val { font-size: 14px; font-weight: 800; color: var(--body-color); word-break: break-word; }
        .profile-crop-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
        .profile-crop-tag { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; background: rgba(46,125,50,0.1); color: #2e7d32; }
        .profile-no-tags { font-size: 12px; color: var(--text-main, #6b7c72); font-style: italic; }

        /* Panel Header */
        .profile-panel-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
        .profile-panel-title { font-size: 18px; font-weight: 800; color: var(--body-color); margin: 0 0 2px; }
        .profile-panel-sub { font-size: 13px; color: var(--text-main, #6b7c72); margin: 0; }
        .profile-edit-toggle-btn {
          padding: 8px 16px; border-radius: 12px; background: rgba(46,125,50,0.08);
          color: #2e7d32; border: 1.5px solid rgba(46,125,50,0.2);
          font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .profile-edit-toggle-btn:hover { background: rgba(46,125,50,0.15); }

        /* Details Grid */
        .profile-details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .profile-details-grid { grid-template-columns: 1fr; } }
        .profile-detail-card {
          background: rgba(0,0,0,0.02); border: 1px solid var(--glass-border, rgba(0,0,0,0.06));
          border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 4px;
        }
        .profile-detail-label { font-size: 11.5px; font-weight: 700; text-transform: uppercase; color: var(--text-main, #6b7c72); display: flex; align-items: center; gap: 5px; }
        .profile-detail-val { font-size: 14.5px; font-weight: 800; color: var(--body-color); word-break: break-word; }

        /* Form */
        .profile-edit-form { display: flex; flex-direction: column; gap: 18px; width: 100%; }
        .profile-form-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .profile-form-two-col { grid-template-columns: 1fr; } }
        .profile-span-2 { grid-column: 1 / -1; }
        @media (max-width: 600px) { .profile-span-2 { grid-column: 1; } }
        .profile-field-group { display: flex; flex-direction: column; gap: 6px; }
        .profile-field-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--text-main, #6b7c72); }
        .profile-field-input {
          background: rgba(255,255,255,0.85); border: 1.5px solid var(--glass-border, rgba(46,125,50,0.2));
          border-radius: 13px; padding: 11px 14px; font-size: 14px; color: var(--body-color);
          outline: none; transition: border-color 0.2s; font-family: inherit; width: 100%; box-sizing: border-box;
        }
        [data-theme="dark"] .profile-field-input { background: rgba(20,32,24,0.85); color: #fff; }
        .profile-field-input:focus { border-color: #2e7d32; box-shadow: 0 0 0 3px rgba(46,125,50,0.12); }

        .profile-crop-selector-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
        .profile-crop-btn {
          display: flex; align-items: center; gap: 6px; padding: 8px 14px;
          border-radius: 10px; border: 1.5px solid rgba(0,0,0,0.1); background: transparent;
          color: var(--text-main, #6b7c72); font-weight: 700; font-size: 12.5px; cursor: pointer;
          transition: all 0.2s;
        }
        .profile-crop-btn-active {
          border-color: #2e7d32; background: rgba(46,125,50,0.1); color: #2e7d32;
        }
        .profile-save-btn {
          align-self: flex-start; padding: 12px 28px; border-radius: 14px;
          background: linear-gradient(135deg, #2e7d32, #1b5e20); color: #fff;
          border: none; font-weight: 700; font-size: 14px; cursor: pointer;
          box-shadow: 0 4px 14px rgba(46,125,50,0.25); transition: all 0.2s;
        }
        .profile-save-btn:hover { transform: translateY(-1px); }

        /* Sessions List */
        .profile-sessions-list { display: flex; flex-direction: column; gap: 12px; }
        .profile-session-card {
          background: rgba(0,0,0,0.02); border: 1px solid var(--glass-border, rgba(0,0,0,0.06));
          border-radius: 14px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 8px;
        }
        .profile-session-left { display: flex; align-items: center; gap: 14px; }
        .profile-session-icon { color: #2e7d32; flex-shrink: 0; }
        .profile-session-device { font-size: 13.5px; font-weight: 700; color: var(--body-color); display: block; }
        .profile-session-status { font-size: 11.5px; color: var(--text-main, #6b7c72); }
        .profile-session-badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; background: rgba(46,125,50,0.1); color: #2e7d32; }

        .profile-logout-all-btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 8px; padding: 12px; border-radius: 14px;
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #fff;
          border: none; font-weight: 700; font-size: 13.5px; cursor: pointer;
          box-shadow: 0 4px 14px rgba(239,68,68,0.25); transition: all 0.2s;
          width: 100%;
        }
        .profile-logout-all-btn:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); transform: translateY(-1px);
        }
      `}</style>
    </MainLayout>
  );
};

export default Profile;
