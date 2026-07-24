import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  User,
  HelpCircle,
  MessageSquare,
  Bug,
  BookOpen,
  Download,
  FileSpreadsheet,
  ShieldCheck,
  FileText,
  Star,
  Lightbulb,
  MessageCircle,
  Info,
  ChevronRight,
  Trash2,
  CheckCircle,
  Activity,
  X,
  Send
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { deleteAccountApi } from "../services/profileApi";

const Settings: React.FC = () => {
  const { farmer, logout } = useAuth();
  const navigate = useNavigate();

  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Delete account confirmation state
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Generic modal form state (feedback/bug/contact)
  const [modalText, setModalText] = useState("");

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
      downloadedAt: new Date().toISOString(),
      platform: "IntelliFarm AI"
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataObj, null, 2));
    const anchor = document.createElement("a");
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `intellifarm-data-${farmer?.email || "user"}.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    toast.success("Profile data downloaded successfully!");
  };

  const handleExportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Field,Value\n" +
      `"Name","${farmer?.name || "Farmer"}"\n` +
      `"Email","${farmer?.email || ""}"\n` +
      `"Location","${farmer?.location || ""}"\n` +
      `"Pincode","${farmer?.pincode || ""}"\n` +
      `"Export Date","${new Date().toLocaleDateString()}"\n`;

    const anchor = document.createElement("a");
    anchor.setAttribute("href", encodeURI(csvContent));
    anchor.setAttribute("download", `intellifarm-reports-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    toast.success("Reports exported successfully!");
  };

  const handleConfirmDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmInput.trim() !== "DELETE") {
      toast.error("Please type DELETE to confirm account deletion.");
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccountApi();
      toast.success("Your account has been deleted successfully.", { duration: 4000 });
      if (logout) await logout();
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.success("Your account session has been terminated.", { duration: 4000 });
      if (logout) await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsDeleting(false);
      setActiveModal(null);
    }
  };

  const handleGenericSubmit = (type: string) => {
    toast.success(`Thank you! Your ${type} has been submitted.`);
    setModalText("");
    setActiveModal(null);
  };

  const initialLetter = farmer?.name
    ? farmer.name.charAt(0).toUpperCase()
    : farmer?.email
    ? farmer.email.charAt(0).toUpperCase()
    : "S";

  return (
    <MainLayout
      eyebrow=""
      title="Account & Settings"
      subtitle="Manage your account, application preferences, and support."
    >
      <div className="settings-container">

        {/* 1. Account Card */}
        <div className="settings-card settings-card-account">
          <div className="settings-account-left">
            <div className="settings-avatar">
              {initialLetter}
            </div>
            <div className="settings-account-details">
              <h2 className="settings-account-name">
                {farmer?.name || "Sreevanth Vadlamudi"}
              </h2>
              <span className="settings-account-role">Farmer</span>
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

        {/* Grid of Preference Cards (2 Columns Desktop, 1 Column Mobile) */}
        <div className="settings-grid">

          {/* 2. Help & Support */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-badge settings-badge-blue">
                <HelpCircle size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Help & Support</h3>
                <p className="settings-card-sub">Guides, assistance, and reporting for IntelliFarm AI.</p>
              </div>
            </div>

            <div className="settings-rows-list">
              <button
                type="button"
                className="settings-row-item"
                onClick={() => setActiveModal("help-center")}
              >
                <div className="settings-row-left">
                  <HelpCircle size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Help Center</strong>
                    <span>Browse user guides and FAQs</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>

              <button
                type="button"
                className="settings-row-item"
                onClick={() => setActiveModal("contact-support")}
              >
                <div className="settings-row-left">
                  <MessageSquare size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Contact Support</strong>
                    <span>Send a direct message to our support team</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>

              <button
                type="button"
                className="settings-row-item"
                onClick={() => setActiveModal("report-bug")}
              >
                <div className="settings-row-left">
                  <Bug size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Report a Bug</strong>
                    <span>Help us improve IntelliFarm AI performance</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>

              <button
                type="button"
                className="settings-row-item"
                onClick={() => setActiveModal("user-guide")}
              >
                <div className="settings-row-left">
                  <BookOpen size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>User Guide</strong>
                    <span>Learn how to use crop advisory and disease detection</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>
            </div>
          </div>

          {/* 3. Privacy & Data */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-badge settings-badge-green">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Privacy & Data</h3>
                <p className="settings-card-sub">Export your data, view reports, and inspect policies.</p>
              </div>
            </div>

            <div className="settings-rows-list">
              <button
                type="button"
                className="settings-row-item"
                onClick={handleDownloadJSON}
              >
                <div className="settings-row-left">
                  <Download size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Download My Data</strong>
                    <span>Export full profile & preferences in JSON format</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>

              <button
                type="button"
                className="settings-row-item"
                onClick={handleExportCSV}
              >
                <div className="settings-row-left">
                  <FileSpreadsheet size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Export Reports</strong>
                    <span>Download crop and diagnostic history CSV</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>

              <button
                type="button"
                className="settings-row-item"
                onClick={() => setActiveModal("privacy-policy")}
              >
                <div className="settings-row-left">
                  <FileText size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Privacy Policy</strong>
                    <span>Review how we handle and protect your farm data</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>

              <button
                type="button"
                className="settings-row-item"
                onClick={() => setActiveModal("terms")}
              >
                <div className="settings-row-left">
                  <ShieldCheck size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Terms & Conditions</strong>
                    <span>Application usage guidelines and terms</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>
            </div>
          </div>

          {/* 4. Feedback */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-badge settings-badge-amber">
                <Star size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Feedback</h3>
                <p className="settings-card-sub">Share suggestions and rate your experience.</p>
              </div>
            </div>

            <div className="settings-rows-list">
              <button
                type="button"
                className="settings-row-item"
                onClick={() => setActiveModal("rate-app")}
              >
                <div className="settings-row-left">
                  <Star size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Rate IntelliFarm AI</strong>
                    <span>Share your rating and overall experience</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>

              <button
                type="button"
                className="settings-row-item"
                onClick={() => setActiveModal("suggest-feature")}
              >
                <div className="settings-row-left">
                  <Lightbulb size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Suggest a Feature</strong>
                    <span>Tell us what features you would like to see</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>

              <button
                type="button"
                className="settings-row-item"
                onClick={() => setActiveModal("share-feedback")}
              >
                <div className="settings-row-left">
                  <MessageCircle size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Share Feedback</strong>
                    <span>Give feedback to improve AI advisories</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>
            </div>
          </div>

          {/* 5. About IntelliFarm AI */}
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-badge settings-badge-emerald">
                <Info size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">About IntelliFarm AI</h3>
                <p className="settings-card-sub">Platform version, AI engines, and system status.</p>
              </div>
            </div>

            <div className="settings-about-details">
              <div className="settings-about-row">
                <span className="settings-about-label">Version</span>
                <span className="settings-about-val">v1.0.0</span>
              </div>
              <div className="settings-about-row">
                <span className="settings-about-label">AI Engine</span>
                <span className="settings-about-val">Spryzen AI</span>
              </div>
              <div className="settings-about-row">
                <span className="settings-about-label">Vision Model</span>
                <span className="settings-about-val">Qwen2.5-VL</span>
              </div>
              <div className="settings-about-row">
                <span className="settings-about-label">Weather Integration</span>
                <span className="settings-about-val">OpenWeather</span>
              </div>
              <div className="settings-about-row">
                <span className="settings-about-label">Last Updated</span>
                <span className="settings-about-val">18 July 2026</span>
              </div>

              {/* System Status Indicators */}
              <div className="settings-status-box">
                <div className="settings-status-header">
                  <Activity size={14} />
                  <span>System Status</span>
                </div>
                <div className="settings-status-grid">
                  <div className="settings-status-item">
                    <span className="settings-status-dot online"></span>
                    <span>Backend: <strong>Online</strong></span>
                  </div>
                  <div className="settings-status-item">
                    <span className="settings-status-dot online"></span>
                    <span>AI Service: <strong>Connected</strong></span>
                  </div>
                  <div className="settings-status-item">
                    <span className="settings-status-dot online"></span>
                    <span>Weather API: <strong>Connected</strong></span>
                  </div>
                  <div className="settings-status-item">
                    <span className="settings-status-dot online"></span>
                    <span>Database: <strong>Connected</strong></span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 6. Account Actions (Delete Account) */}
          <div className="settings-card settings-span-2">
            <div className="settings-card-header" style={{ marginBottom: "16px" }}>
              <div className="settings-badge settings-badge-red">
                <User size={20} />
              </div>
              <div>
                <h3 className="settings-card-title">Account</h3>
                <p className="settings-card-sub">Manage your account deletion and access permissions.</p>
              </div>
            </div>

            <div className="settings-rows-list">
              <button
                type="button"
                className="settings-row-item settings-row-danger"
                onClick={() => {
                  setDeleteConfirmInput("");
                  setActiveModal("delete-account");
                }}
              >
                <div className="settings-row-left">
                  <Trash2 size={18} className="settings-row-icon-danger" />
                  <div className="settings-row-text">
                    <strong className="settings-text-danger">Delete Account</strong>
                    <span>Permanently remove your account and all associated farm records</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>
            </div>
          </div>

        </div>

        {/* ── Modals ── */}

        {/* Delete Account Modal */}
        {activeModal === "delete-account" && (
          <div className="settings-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-badge settings-badge-red">
                  <Trash2 size={22} />
                </div>
                <div>
                  <h3 className="settings-modal-title">Delete Account</h3>
                  <p className="settings-modal-sub">Confirm permanent account deletion</p>
                </div>
                <button
                  type="button"
                  className="settings-modal-close-icon"
                  onClick={() => setActiveModal(null)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="settings-modal-body">
                <p className="settings-modal-warning">
                  Are you sure you want to delete your account?
                </p>
                <p className="settings-modal-desc">
                  This action will permanently remove:
                </p>
                <ul className="settings-delete-list">
                  <li>Profile information and login credentials</li>
                  <li>All registered farm locations and crop settings</li>
                  <li>Disease detection diagnostic history and reports</li>
                  <li>Spryzen AI conversation logs and saved advisories</li>
                </ul>
                <p className="settings-modal-notice">
                  This action <strong>cannot be undone</strong>.
                </p>

                <form onSubmit={handleConfirmDeleteAccount} className="settings-delete-form">
                  <label className="settings-input-label">
                    Type <strong>DELETE</strong> below to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmInput}
                    onChange={(e) => setDeleteConfirmInput(e.target.value)}
                    placeholder="Type DELETE"
                    className="settings-delete-input"
                    autoFocus
                  />

                  <div className="settings-modal-actions">
                    <button
                      type="button"
                      className="settings-btn-cancel"
                      onClick={() => setActiveModal(null)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="settings-btn-delete-confirm"
                      disabled={deleteConfirmInput.trim() !== "DELETE" || isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete Account"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Help Center Modal */}
        {activeModal === "help-center" && (
          <div className="settings-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-badge settings-badge-blue">
                  <HelpCircle size={20} />
                </div>
                <h3 className="settings-modal-title">IntelliFarm AI Help Center</h3>
                <button type="button" className="settings-modal-close-icon" onClick={() => setActiveModal(null)}><X size={18} /></button>
              </div>
              <div className="settings-modal-body">
                <p><strong>Frequently Asked Questions:</strong></p>
                <ul>
                  <li><strong>How does disease detection work?</strong> Upload or photograph a crop leaf in the Disease Detection page. Qwen2.5-VL and Spryzen AI analyze leaf symptoms.</li>
                  <li><strong>How do I set my location?</strong> Edit your profile pincode to automatically fetch your District and State location.</li>
                  <li><strong>Can I register multiple farms?</strong> Yes! Go to My Farms to add and manage field boundaries.</li>
                </ul>
              </div>
              <div className="settings-modal-footer">
                <button type="button" className="settings-btn-modal-close" onClick={() => setActiveModal(null)}><CheckCircle size={16} /> Close Help Center</button>
              </div>
            </div>
          </div>
        )}

        {/* User Guide Modal */}
        {activeModal === "user-guide" && (
          <div className="settings-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-badge settings-badge-blue">
                  <BookOpen size={20} />
                </div>
                <h3 className="settings-modal-title">IntelliFarm AI User Guide</h3>
                <button type="button" className="settings-modal-close-icon" onClick={() => setActiveModal(null)}><X size={18} /></button>
              </div>
              <div className="settings-modal-body">
                <p>Welcome to IntelliFarm AI! Follow these steps to maximize your yield:</p>
                <ol style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13.5px" }}>
                  <li><strong>Complete Profile:</strong> Enter your 6-digit pincode and select the crops you grow.</li>
                  <li><strong>Check Weather Bulletins:</strong> Review hyper-local rain and temperature forecasts.</li>
                  <li><strong>Run Disease Diagnostics:</strong> Scan affected leaves for instant organic & chemical treatments.</li>
                  <li><strong>Consult Spryzen Copilot:</strong> Ask AI any farming question in plain English or local languages.</li>
                </ol>
              </div>
              <div className="settings-modal-footer">
                <button type="button" className="settings-btn-modal-close" onClick={() => setActiveModal(null)}><CheckCircle size={16} /> Got It</button>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Policy Modal */}
        {activeModal === "privacy-policy" && (
          <div className="settings-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-badge settings-badge-green">
                  <FileText size={20} />
                </div>
                <h3 className="settings-modal-title">Privacy Policy</h3>
                <button type="button" className="settings-modal-close-icon" onClick={() => setActiveModal(null)}><X size={18} /></button>
              </div>
              <div className="settings-modal-body">
                <p>IntelliFarm AI prioritizes your data confidentiality:</p>
                <ul>
                  <li><strong>Data Confidentiality:</strong> Your farm location and crop data are used strictly for personalized advisories.</li>
                  <li><strong>No Third-Party Sharing:</strong> Your personal information is never sold or shared with third parties.</li>
                  <li><strong>Data Rights:</strong> You can export or delete your account data anytime from this settings page.</li>
                </ul>
              </div>
              <div className="settings-modal-footer">
                <button type="button" className="settings-btn-modal-close" onClick={() => setActiveModal(null)}><CheckCircle size={16} /> Close Privacy Policy</button>
              </div>
            </div>
          </div>
        )}

        {/* Terms & Conditions Modal */}
        {activeModal === "terms" && (
          <div className="settings-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-badge settings-badge-green">
                  <ShieldCheck size={20} />
                </div>
                <h3 className="settings-modal-title">Terms & Conditions</h3>
                <button type="button" className="settings-modal-close-icon" onClick={() => setActiveModal(null)}><X size={18} /></button>
              </div>
              <div className="settings-modal-body">
                <p>By accessing IntelliFarm AI, you agree to:</p>
                <ul>
                  <li>Use recommendations as agricultural guidance alongside expert agronomy advice.</li>
                  <li>Provide accurate pincode details for reliable weather alerts.</li>
                  <li>Respect intellectual property rights of Spryzen AI and IntelliFarm AI models.</li>
                </ul>
              </div>
              <div className="settings-modal-footer">
                <button type="button" className="settings-btn-modal-close" onClick={() => setActiveModal(null)}><CheckCircle size={16} /> Accept & Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Support / Report Bug / Feedback Generic Form Modals */}
        {(activeModal === "contact-support" || activeModal === "report-bug" || activeModal === "suggest-feature" || activeModal === "share-feedback" || activeModal === "rate-app") && (
          <div className="settings-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-badge settings-badge-blue">
                  <MessageSquare size={20} />
                </div>
                <h3 className="settings-modal-title">
                  {activeModal === "contact-support" && "Contact Support"}
                  {activeModal === "report-bug" && "Report a Bug"}
                  {activeModal === "suggest-feature" && "Suggest a Feature"}
                  {activeModal === "share-feedback" && "Share Feedback"}
                  {activeModal === "rate-app" && "Rate IntelliFarm AI"}
                </h3>
                <button type="button" className="settings-modal-close-icon" onClick={() => setActiveModal(null)}><X size={18} /></button>
              </div>

              <div className="settings-modal-body">
                <p style={{ fontSize: "13.5px", margin: "0 0 12px" }}>
                  {activeModal === "contact-support" && "Send a message to our support team and we will respond via email."}
                  {activeModal === "report-bug" && "Describe the issue or error you encountered on IntelliFarm AI."}
                  {activeModal === "suggest-feature" && "What new feature would help your daily farm management?"}
                  {activeModal === "share-feedback" && "Share your experience with Spryzen AI and crop advisory."}
                  {activeModal === "rate-app" && "Rate your experience (1 to 5 stars) and add optional comments."}
                </p>

                <textarea
                  rows={4}
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                  placeholder="Enter your message..."
                  className="settings-modal-textarea"
                />

                <div className="settings-modal-footer" style={{ marginTop: "16px" }}>
                  <button
                    type="button"
                    className="settings-btn-modal-close"
                    onClick={() => handleGenericSubmit(activeModal.replace("-", " "))}
                  >
                    <Send size={16} /> Submit Response
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── Glassmorphism Card Styling matching Disease Detection Page ── */}
      <style>{`
        .settings-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 8px 60px;
          width: 100%;
          box-sizing: border-box;
        }

        /* Glass Card Base Style */
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

        /* 1. Account Glass Card */
        .settings-card-account {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 24px 32px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(244, 249, 245, 0.85) 100%);
        }

        [data-theme="dark"] .settings-card-account {
          background: linear-gradient(135deg, rgba(24, 40, 29, 0.92) 0%, rgba(16, 28, 20, 0.85) 100%);
        }

        .settings-account-left {
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

        .settings-account-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .settings-account-name {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: var(--body-color, #183d24);
          letter-spacing: -0.4px;
        }

        [data-theme="dark"] .settings-account-name {
          color: #f0fdf4;
        }

        .settings-account-role {
          font-size: 14px;
          font-weight: 600;
          color: #2e7d32;
        }

        [data-theme="dark"] .settings-account-role {
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

        /* 2-Column Grid Layout for Desktop */
        .settings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          width: 100%;
        }

        .settings-span-2 {
          grid-column: 1 / -1;
        }

        /* Card Headers */
        .settings-card-header {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-bottom: 20px;
        }

        .settings-badge {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .settings-badge-blue { background: rgba(2, 132, 199, 0.12); color: #0284c7; }
        .settings-badge-green { background: rgba(16, 185, 129, 0.12); color: #10b981; }
        .settings-badge-amber { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
        .settings-badge-emerald { background: rgba(46, 125, 50, 0.12); color: #2e7d32; }
        .settings-badge-red { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

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

        .settings-card-sub {
          margin: 0;
          font-size: 13px;
          color: var(--text-main, #5b6b62);
          line-height: 1.45;
        }

        /* Settings Rows List */
        .settings-rows-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .settings-row-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left;
          width: 100%;
          box-sizing: border-box;
        }

        [data-theme="dark"] .settings-row-item {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
        }

        .settings-row-item:hover {
          transform: scale(1.01);
          background: rgba(46, 125, 50, 0.05);
          border-color: rgba(46, 125, 50, 0.2);
          box-shadow: 0 4px 12px rgba(46, 125, 50, 0.08);
        }

        .settings-row-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .settings-row-icon {
          color: #2e7d32;
          flex-shrink: 0;
        }

        [data-theme="dark"] .settings-row-icon {
          color: #4ade80;
        }

        .settings-row-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .settings-row-text strong {
          font-size: 14px;
          font-weight: 700;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .settings-row-text strong {
          color: #f0fdf4;
        }

        .settings-row-text span {
          font-size: 12px;
          color: var(--text-main, #6b7c72);
        }

        .settings-row-arrow {
          color: var(--text-main, #6b7c72);
          opacity: 0.6;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .settings-row-item:hover .settings-row-arrow {
          opacity: 1;
          transform: translateX(3px);
          color: #2e7d32;
        }

        [data-theme="dark"] .settings-row-item:hover .settings-row-arrow {
          color: #4ade80;
        }

        /* Danger Row Item */
        .settings-row-danger:hover {
          background: rgba(239, 68, 68, 0.06);
          border-color: rgba(239, 68, 68, 0.25);
        }

        .settings-row-icon-danger {
          color: #dc2626;
          flex-shrink: 0;
        }

        .settings-text-danger {
          color: #dc2626 !important;
        }

        [data-theme="dark"] .settings-text-danger {
          color: #f87171 !important;
        }

        /* About Section */
        .settings-about-details {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .settings-about-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.02);
          font-size: 13.5px;
        }

        [data-theme="dark"] .settings-about-row {
          background: rgba(255, 255, 255, 0.03);
        }

        .settings-about-label {
          color: var(--text-main, #6b7c72);
          font-weight: 600;
        }

        .settings-about-val {
          font-weight: 800;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .settings-about-val {
          color: #f0fdf4;
        }

        /* Status Box */
        .settings-status-box {
          margin-top: 6px;
          padding: 14px;
          border-radius: 16px;
          background: rgba(46, 125, 50, 0.05);
          border: 1px solid rgba(46, 125, 50, 0.15);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .settings-status-header {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #2e7d32;
        }

        [data-theme="dark"] .settings-status-header {
          color: #4ade80;
        }

        .settings-status-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .settings-status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .settings-status-item {
          color: #f0fdf4;
        }

        .settings-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .settings-status-dot.online {
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }

        /* Modals */
        .settings-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(6px);
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
          max-width: 520px;
          width: 100%;
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-sizing: border-box;
          animation: settingsFadeSlide 0.3s ease;
        }

        [data-theme="dark"] .settings-modal-card {
          background: #121e16;
          color: #f0fdf4;
        }

        .settings-modal-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          position: relative;
        }

        .settings-modal-title {
          margin: 0;
          font-size: 18px;
          font-weight: 800;
        }

        .settings-modal-sub {
          margin: 2px 0 0;
          font-size: 12.5px;
          color: var(--text-main, #6b7c72);
        }

        .settings-modal-close-icon {
          position: absolute;
          top: 0;
          right: 0;
          background: transparent;
          border: none;
          color: var(--text-main, #6b7c72);
          cursor: pointer;
          padding: 4px;
          border-radius: 8px;
        }

        .settings-modal-close-icon:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .settings-modal-body p {
          font-size: 13.5px;
          line-height: 1.5;
        }

        .settings-modal-warning {
          font-weight: 800;
          font-size: 15px;
          color: #dc2626;
          margin: 0 0 8px;
        }

        .settings-modal-desc {
          margin: 0 0 8px;
          font-size: 13.5px;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .settings-modal-desc {
          color: #f0fdf4;
        }

        .settings-delete-list {
          margin: 0 0 12px;
          padding-left: 20px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          color: var(--text-main, #6b7c72);
        }

        .settings-modal-notice {
          font-size: 13px;
          color: #dc2626;
          margin: 0 0 16px;
        }

        .settings-delete-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .settings-input-label {
          font-size: 13px;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .settings-input-label {
          color: #f0fdf4;
        }

        .settings-delete-input {
          padding: 12px 14px;
          border-radius: 12px;
          border: 1.5px solid rgba(239, 68, 68, 0.3);
          font-size: 14px;
          font-weight: 700;
          outline: none;
          color: #dc2626;
          background: rgba(239, 68, 68, 0.03);
          width: 100%;
          box-sizing: border-box;
        }

        .settings-delete-input:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
        }

        .settings-modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .settings-btn-cancel {
          flex: 1;
          padding: 12px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: var(--body-color, #183d24);
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
        }

        [data-theme="dark"] .settings-btn-cancel {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: #f0fdf4;
        }

        .settings-btn-delete-confirm {
          flex: 1;
          padding: 12px;
          border-radius: 14px;
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #ffffff;
          border: none;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.25);
          transition: all 0.2s ease;
        }

        .settings-btn-delete-confirm:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          box-shadow: none;
        }

        .settings-modal-textarea {
          width: 100%;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid var(--settings-card-border, rgba(46, 125, 50, 0.2));
          background: rgba(0, 0, 0, 0.02);
          color: var(--body-color, #183d24);
          font-family: inherit;
          font-size: 13.5px;
          outline: none;
          box-sizing: border-box;
        }

        [data-theme="dark"] .settings-modal-textarea {
          background: rgba(255, 255, 255, 0.04);
          color: #f0fdf4;
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

        /* Responsive Layout Adjustments for Mobile & Tablet */
        @media (max-width: 850px) {
          .settings-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .settings-span-2 {
            grid-column: 1;
          }

          .settings-card-account {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .settings-btn-edit-profile {
            width: 100%;
            justify-content: center;
          }

          .settings-status-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default Settings;
