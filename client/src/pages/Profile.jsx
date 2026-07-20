import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { fetchProfile, updateProfile } from "../services/profileApi";
import { fetchFarms } from "../services/farmApi";

const Profile = () => {
  const { farmer, applySession } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Edit Profile form state
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [profileImg, setProfileImg] = useState("");

  const availableCrops = ["Paddy", "Tomato", "Maize", "Wheat", "Cotton", "Soybean", "Potato", "Chilli"];
  const [farms, setFarms] = useState([]);
  const [farmsLoading, setFarmsLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const { data } = await fetchProfile();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setName(data.profile.name || "");
        setLocation(data.profile.location || "");
        setFarmSize(data.profile.farmSize || "3 acres");
        setSelectedCrops(data.profile.cropsInterested || []);
        setProfileImg(data.profile.profileImg || "");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      const user = farmer || {};
      setName(user.name || "");
      setLocation(user.location || "");
      setFarmSize(user.farmSize || "3 acres");
      setSelectedCrops(user.cropsInterested || []);
      setProfileImg(user.profileImg || "");
    }
  }, [farmer]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    setFarmsLoading(true);
    fetchFarms()
      .then(({ data }) => { if (data.success) setFarms(data.farms || []); })
      .catch(() => {})
      .finally(() => setFarmsLoading(false));
  }, []);

  const calculateCompletion = () => {
    let score = 0;
    if (name) score += 25;
    if (location) score += 25;
    if (farmSize) score += 25;
    if (profileImg || (profile && profile.profileImg)) score += 25;
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
            toast.success("Profile image updated!");
            applySession(data.user);
          }
        } catch (err) {
          toast.error("Failed to upload image");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await updateProfile({
        name,
        location,
        farmSize,
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

  const currentFarmer = profile || farmer || {};
  const completionPercent = calculateCompletion();

  // Mock sessions list
  const activeSessions = [
    { device: "Chrome (Mac OS Monterey)", ip: "192.168.1.42", status: "Active Now", icon: "💻" },
    { device: "Mobile App (iPhone 14)", ip: "172.56.21.99", status: "Active 2 hours ago", icon: "📱" }
  ];

  // Activity log — enrich with farm data
  const activityLogs = [
    { title: "Farms Registered", detail: farms.length > 0 ? `${farms.length} farm(s) — ${[...new Set(farms.map(f => f.crop))].join(", ")}` : "No farms yet", time: "Now" },
    { title: "Leaf Scan Uploaded", detail: "Early Blight spotted on Tomato Crop", time: "2 hours ago" },
    { title: "Profile Modified", detail: "Updated farm location and interested crops list", time: "3 days ago" }
  ];

  return (
    <MainLayout
      eyebrow="Farmer Account"
      title="My Profile"
      subtitle="Manage your profile information, farm parameters, and active device sessions"
    >
      <style>{`
        .profile-main-grid {
          display: grid;
          grid-template-columns: 1fr 2.2fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .profile-main-grid {
            grid-template-columns: 1fr;
          }
        }
        .profile-form-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 600px) {
          .profile-form-two-col {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="profile-main-grid">
        
        {/* Left Column: Avatar, Completion, Quick Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="liquid-glass-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center" }}>
            <div style={{ position: "relative" }}>
              <img
                src={profileImg || currentFarmer.profileImg || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || "Farmer")}`}
                alt="Farmer Profile"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid var(--sidebar-active-color, #2e7d32)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.25)"
                }}
              />
              <label
                htmlFor="avatar-upload"
                style={{
                  position: "absolute",
                  bottom: "0",
                  right: "0",
                  background: "linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)",
                  color: "#fff",
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                  fontSize: "14px",
                  border: "1px solid rgba(255,255,255,0.15)"
                }}
              >
                📷
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />
            </div>

            <div>
              <h2 style={{ margin: "0 0 4px 0", color: "var(--body-color)" }}>{currentFarmer.name || "Farmer"}</h2>
              <span style={{ fontSize: "14px", color: "var(--text-main, #5b6b62)" }}>{currentFarmer.email}</span>
            </div>

            {/* Dynamic Profile Completion % */}
            <div style={{ width: "100%", marginTop: "8px", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "bold", marginBottom: "6px" }}>
                <span>Profile Completion</span>
                <span style={{ color: "#52b788" }}>{completionPercent}% Complete</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${completionPercent}%`, height: "100%", background: "#52b788", transition: "width 0.4s ease" }}></div>
              </div>
            </div>

            <div style={{ width: "100%", height: "1px", background: "rgba(255, 255, 255, 0.08)", margin: "8px 0" }}></div>

            <div style={{ width: "100%", textAlign: "left", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#8e918f", display: "block" }}>Location</span>
                <strong style={{ color: "var(--body-color)" }}>{currentFarmer.location || "Not Specified"}</strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#8e918f", display: "block" }}>Farm Size</span>
                <strong style={{ color: "var(--body-color)" }}>{currentFarmer.farmSize || "Not Specified"}</strong>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#8e918f", display: "block" }}>Crops Interested</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                  {(currentFarmer.cropsInterested || []).map((crop) => (
                    <span
                      key={crop}
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: "rgba(82, 183, 136, 0.15)",
                        color: "#52b788"
                      }}
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Farm Overview Card */}
          <div className="liquid-glass-panel" style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "var(--body-color)" }}>🌾 Farm Overview</h3>
              <Link to="/farms" style={{ fontSize: "12px", fontWeight: 700, color: "#52b788", textDecoration: "none" }}>Manage →</Link>
            </div>
            {farmsLoading ? (
              <p style={{ fontSize: "13px", color: "#8e918f", margin: 0 }}>Loading farms...</p>
            ) : farms.length === 0 ? (
              <div style={{ textAlign: "center", padding: "16px 0" }}>
                <p style={{ fontSize: "13px", color: "#8e918f", margin: "0 0 12px" }}>No farms registered yet.</p>
                <Link to="/farms" className="glass-btn-primary" style={{ textDecoration: "none", padding: "8px 16px", fontSize: "13px", display: "inline-block", borderRadius: "10px" }}>+ Add Farm</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="profile-form-two-col">
                  <div style={{ background: "rgba(82,183,136,0.06)", borderRadius: "12px", padding: "10px 14px" }}>
                    <span style={{ fontSize: "10px", color: "#8e918f", fontWeight: 700, textTransform: "uppercase" }}>Total Farms</span>
                    <strong style={{ display: "block", fontSize: "22px", color: "#52b788", fontWeight: 800 }}>{farms.length}</strong>
                  </div>
                  <div style={{ background: "rgba(82,183,136,0.06)", borderRadius: "12px", padding: "10px 14px" }}>
                    <span style={{ fontSize: "10px", color: "#8e918f", fontWeight: 700, textTransform: "uppercase" }}>Total Area</span>
                    <strong style={{ display: "block", fontSize: "22px", color: "#52b788", fontWeight: 800 }}>{farms.map(f => parseFloat(f.area) || 0).reduce((a, b) => a + b, 0).toFixed(1)} ac</strong>
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "#8e918f", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Active Crops</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                    {[...new Set(farms.map(f => f.crop))].map(c => (
                      <span key={c} style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "6px", background: "rgba(82,183,136,0.12)", color: "#52b788" }}>{c}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: "10px", color: "#8e918f", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Farm Names</span>
                  {farms.slice(0, 3).map(f => (
                    <div key={f.id} style={{ fontSize: "12px", color: "var(--body-color)", fontWeight: 600, padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      📍 {f.name} — {f.crop}
                    </div>
                  ))}
                  {farms.length > 3 && <span style={{ fontSize: "11px", color: "#8e918f" }}>+{farms.length - 3} more</span>}
                </div>
              </div>
            )}
          </div>

          {/* Linked accounts */}
          <div className="liquid-glass-panel" style={{ padding: "20px" }}>
            <h3 style={{ margin: "0 0 16px 0", color: "#fff", fontSize: "16px", fontWeight: 700 }}>Linked Accounts</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "20px" }}>👤</span>
                  <div>
                    <strong style={{ color: "#fff", display: "block", fontSize: "13px" }}>Email Credentials</strong>
                    <span style={{ fontSize: "11px", color: "#8e918f" }}>Login via Email/Password</span>
                  </div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 8px", borderRadius: "6px", background: "rgba(82, 183, 136, 0.15)", color: "#52b788" }}>Connected</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "20px" }}>🌐</span>
                  <div>
                    <strong style={{ color: "#fff", display: "block", fontSize: "13px" }}>Google Account</strong>
                    <span style={{ fontSize: "11px", color: "#8e918f" }}>One-click login helper</span>
                  </div>
                </div>
                <span style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  borderRadius: "6px",
                  background: currentFarmer.email?.includes("@gmail.com") ? "rgba(82, 183, 136, 0.15)" : "rgba(255,255,255,0.05)",
                  color: currentFarmer.email?.includes("@gmail.com") ? "#52b788" : "#8e918f"
                }}>
                  {currentFarmer.email?.includes("@gmail.com") ? "Linked" : "Not Linked"}
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Farming details forms & Activities & Sessions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Main Account Settings */}
          <div className="liquid-glass-panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ margin: 0, color: "#fff", fontSize: "18px", fontWeight: 700 }}>Farming Profile Details</h2>
              <button
                onClick={() => setEditMode(!editMode)}
                className="glass-btn-secondary"
                style={{ padding: "6px 14px", fontSize: "13px" }}
              >
                {editMode ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {!editMode ? (
              <div className="profile-form-two-col">
                <div>
                  <span style={{ fontSize: "12px", color: "#8e918f", display: "block" }}>Full Name</span>
                  <p style={{ margin: "4px 0 0 0", fontWeight: 700, color: "var(--body-color)", fontSize: "14px" }}>{currentFarmer.name || "N/A"}</p>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#8e918f", display: "block" }}>Email Address</span>
                  <p style={{ margin: "4px 0 0 0", fontWeight: 700, color: "var(--body-color)", fontSize: "14px" }}>{currentFarmer.email || "N/A"}</p>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#8e918f", display: "block" }}>Primary Location</span>
                  <p style={{ margin: "4px 0 0 0", fontWeight: 700, color: "var(--body-color)", fontSize: "14px" }}>{currentFarmer.location || "N/A"}</p>
                </div>
                <div>
                  <span style={{ fontSize: "12px", color: "#8e918f", display: "block" }}>Farming Land Size</span>
                  <p style={{ margin: "4px 0 0 0", fontWeight: 700, color: "var(--body-color)", fontSize: "14px" }}>{currentFarmer.farmSize || "N/A"}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="profile-form-two-col">
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600 }}>Name</label>
                    <input
                      type="text"
                      className="liquid-glass-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600 }}>Location</label>
                    <input
                      type="text"
                      className="liquid-glass-input"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 600 }}>Farm Size</label>
                    <input
                      type="text"
                      className="liquid-glass-input"
                      value={farmSize}
                      onChange={(e) => setFarmSize(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600 }}>Crops of Interest</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {availableCrops.map((crop) => {
                      const active = selectedCrops.includes(crop);
                      return (
                        <button
                          key={crop}
                          type="button"
                          onClick={() => handleCropToggle(crop)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: active ? "1px solid #52b788" : "1px solid rgba(255,255,255,0.08)",
                            background: active ? "rgba(82, 183, 136, 0.1)" : "transparent",
                            color: active ? "#52b788" : "#8e918f",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontSize: "12px",
                            transition: "all 0.2s"
                          }}
                        >
                          {crop}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  className="glass-btn-primary"
                  disabled={loading}
                  style={{ alignSelf: "flex-start", padding: "10px 24px" }}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            )}
          </div>

          {/* Active Device Sessions List */}
          <div className="liquid-glass-panel">
            <h2 style={{ margin: "0 0 16px 0", color: "#fff", fontSize: "18px", fontWeight: 700 }}>Active Sessions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {activeSessions.map((session, index) => (
                <div key={index} className="liquid-glass-card" style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                    <span style={{ fontSize: "20px" }}>{session.icon}</span>
                    <div>
                      <strong style={{ color: "#fff", display: "block", fontSize: "13px" }}>{session.device}</strong>
                      <span style={{ fontSize: "11px", color: "#8e918f" }}>IP Address: {session.ip}</span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: session.status === "Active Now" ? "#52b788" : "#8e918f"
                  }}>{session.status}</span>
                </div>
              ))}
              <button
                className="glass-btn-secondary"
                style={{
                  padding: "10px",
                  fontSize: "12px",
                  marginTop: "8px",
                  borderColor: "rgba(211, 47, 47, 0.2)",
                  color: "#d32f2f"
                }}
                onClick={() => toast.success("Revoked all other devices successfully!")}
              >
                Logout Other Devices
              </button>
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="liquid-glass-panel">
            <h2 style={{ margin: "0 0 16px 0", color: "#fff", fontSize: "18px", fontWeight: 700 }}>Recent Activity</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {activityLogs.map((log, index) => (
                <div key={index} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <strong style={{ color: "#fff", fontSize: "13px" }}>{log.title}</strong>
                    <span style={{ fontSize: "10px", color: "#8e918f" }}>{log.time}</span>
                  </div>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#8e918f" }}>{log.detail}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </MainLayout>
  );
};

export default Profile;
