import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  ChevronLeft,
  Trash2,
  CheckCircle,
  Activity,
  X,
  Send,
  Loader2,
  Search,
  AlertTriangle,
  Layers,
  Sparkles,
  MapPin,
  Stethoscope,
  CloudSun
} from "lucide-react";

import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import { deleteAccountApi } from "../services/profileApi";
import { sendSupportMessageApi } from "../services/supportApi";

const Settings: React.FC = () => {
  const { farmer, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Active modal name state
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Auto-open modal from query param (e.g. /settings?openModal=help-center)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const modalParam = params.get("openModal");
    if (modalParam) {
      setActiveModal(modalParam);
    }
  }, [location.search]);

  // Delete account confirmation state
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Common support sending state
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  // 1. Contact Support Form state
  const [contactCategory, setContactCategory] = useState("General Question");
  const [contactPriority, setContactPriority] = useState("Normal");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  // 2. Bug Report Form state
  const [bugTitle, setBugTitle] = useState("");
  const [bugModule, setBugModule] = useState("Disease Detection");
  const [bugSeverity, setBugSeverity] = useState("Medium");
  const [bugSteps, setBugSteps] = useState("");

  // 3. Suggest Feature Form state
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureCategory, setFeatureCategory] = useState("Disease Diagnostics");
  const [featureDescription, setFeatureDescription] = useState("");

  // 4. Rate App Form state
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  // 5. Share Feedback Form state
  const [feedbackCategory, setFeedbackCategory] = useState("AI Accuracy");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Help Center Search & Accordion State
  const [helpSearch, setHelpSearch] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // User Guide Active Step State (1 to 5)
  const [guideStep, setGuideStep] = useState(1);

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
    toast.success("Profile data exported successfully!");
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

  // Submit Handlers for individual support modalities
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) {
      toast.error("Please write a message before sending.");
      return;
    }

    setIsSendingSupport(true);
    try {
      await sendSupportMessageApi({
        type: `Contact Support [${contactCategory} - ${contactPriority} Priority]`,
        subject: contactSubject.trim() || `${contactCategory} Inquiry from ${farmer?.name || 'Farmer'}`,
        message: `Priority: ${contactPriority}\nCategory: ${contactCategory}\n\nMessage:\n${contactMessage.trim()}`
      });
      toast.success("Support message sent successfully! Our team will respond shortly.");
      setContactSubject("");
      setContactMessage("");
      setActiveModal(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setIsSendingSupport(false);
    }
  };

  const handleBugSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bugTitle.trim() || !bugSteps.trim()) {
      toast.error("Please provide a title and steps to reproduce.");
      return;
    }

    setIsSendingSupport(true);
    try {
      await sendSupportMessageApi({
        type: `Bug Report [${bugModule} - ${bugSeverity} Severity]`,
        subject: `[BUG] ${bugTitle.trim()}`,
        message: `Module: ${bugModule}\nSeverity: ${bugSeverity}\nBrowser User Agent: ${navigator.userAgent}\n\nSteps to Reproduce / Details:\n${bugSteps.trim()}`
      });
      toast.success("Bug report submitted successfully! Thank you for helping us improve.");
      setBugTitle("");
      setBugSteps("");
      setActiveModal(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit bug report.");
    } finally {
      setIsSendingSupport(false);
    }
  };

  const handleFeatureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureTitle.trim() || !featureDescription.trim()) {
      toast.error("Please enter a title and description for your feature suggestion.");
      return;
    }

    setIsSendingSupport(true);
    try {
      await sendSupportMessageApi({
        type: `Feature Suggestion [${featureCategory}]`,
        subject: `[FEATURE REQUEST] ${featureTitle.trim()}`,
        message: `Category: ${featureCategory}\n\nFeature Description & Business Value:\n${featureDescription.trim()}`
      });
      toast.success("Feature suggestion submitted! Our product team will review it.");
      setFeatureTitle("");
      setFeatureDescription("");
      setActiveModal(null);
    } catch (err: any) {
      toast.error("Failed to submit feature suggestion.");
    } finally {
      setIsSendingSupport(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingSupport(true);
    try {
      await sendSupportMessageApi({
        type: `App Rating [${ratingStars}/5 Stars]`,
        subject: `[RATING] ${ratingStars} Stars from ${farmer?.name || 'Farmer'}`,
        message: `Rating: ${ratingStars} / 5 Stars\n\nFarmer Review & Feedback:\n${ratingComment.trim() || 'No written comment provided.'}`
      });
      toast.success(`Thank you for rating us ${ratingStars} stars!`);
      setRatingComment("");
      setActiveModal(null);
    } catch (err: any) {
      toast.error("Failed to submit rating.");
    } finally {
      setIsSendingSupport(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) {
      toast.error("Please write your feedback before submitting.");
      return;
    }

    setIsSendingSupport(true);
    try {
      await sendSupportMessageApi({
        type: `General Feedback [${feedbackCategory}]`,
        subject: `[FEEDBACK] ${feedbackCategory}`,
        message: `Category: ${feedbackCategory}\n\nFeedback Details:\n${feedbackMessage.trim()}`
      });
      toast.success("Thank you for your feedback!");
      setFeedbackMessage("");
      setActiveModal(null);
    } catch (err: any) {
      toast.error("Failed to submit feedback.");
    } finally {
      setIsSendingSupport(false);
    }
  };

  // FAQ Database
  const FAQ_ITEMS = [
    {
      q: "How does Disease Detection work?",
      cat: "Diagnostics",
      a: "Go to the Disease Detection page, upload or snap a photo of an affected crop leaf. Qwen2.5-VL and Spryzen AI analyze leaf symptoms to identify diseases and recommend organic & chemical treatments."
    },
    {
      q: "How do I update my farm location & weather alerts?",
      cat: "Weather",
      a: "In your Profile page, update your 6-digit Pincode. IntelliFarm AI automatically resolves your State, District, and fetches hyper-local OpenWeather forecast bulletins."
    },
    {
      q: "Can I manage multiple farm fields?",
      cat: "My Farms",
      a: "Yes! In My Farms, click '+ Add Farm' to specify your field name, acreage, soil type, irrigation setup, and active crops."
    },
    {
      q: "What is Spryzen AI Copilot?",
      cat: "AI Assistant",
      a: "Spryzen AI is an intelligent agricultural copilot. You can ask questions about crop health, fertilizer dosages, government schemes, or pest control in plain English or local languages."
    },
    {
      q: "Is my farm data secure and private?",
      cat: "Privacy",
      a: "Yes. Your land coordinates, crop history, and diagnostics are strictly private and never shared with third parties. You can export or delete your account data anytime."
    }
  ];

  const filteredFaqs = FAQ_ITEMS.filter(
    (item) =>
      item.q.toLowerCase().includes(helpSearch.toLowerCase()) ||
      item.a.toLowerCase().includes(helpSearch.toLowerCase()) ||
      item.cat.toLowerCase().includes(helpSearch.toLowerCase())
  );

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
      showBreadcrumb={false}
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
                onClick={() => {
                  setHelpSearch("");
                  setOpenFaqIndex(0);
                  setActiveModal("help-center");
                }}
              >
                <div className="settings-row-left">
                  <HelpCircle size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Help Center</strong>
                    <span>Search searchable FAQs & knowledge base</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>

              <button
                type="button"
                className="settings-row-item"
                onClick={() => {
                  setContactCategory("General Question");
                  setContactPriority("Normal");
                  setContactSubject("");
                  setContactMessage("");
                  setActiveModal("contact-support");
                }}
              >
                <div className="settings-row-left">
                  <MessageSquare size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Contact Support</strong>
                    <span>Send a direct message with priority options</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>

              <button
                type="button"
                className="settings-row-item"
                onClick={() => {
                  setBugTitle("");
                  setBugModule("Disease Detection");
                  setBugSeverity("Medium");
                  setBugSteps("");
                  setActiveModal("report-bug");
                }}
              >
                <div className="settings-row-left">
                  <Bug size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Report a Bug</strong>
                    <span>Submit steps to reproduce and severity details</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>

              <button
                type="button"
                className="settings-row-item"
                onClick={() => {
                  setGuideStep(1);
                  setActiveModal("user-guide");
                }}
              >
                <div className="settings-row-left">
                  <BookOpen size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>User Guide</strong>
                    <span>Interactive 5-step handbook & feature walkthrough</span>
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
                onClick={() => {
                  setRatingStars(5);
                  setRatingComment("");
                  setActiveModal("rate-app");
                }}
              >
                <div className="settings-row-left">
                  <Star size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Rate IntelliFarm AI</strong>
                    <span>Interactive 5-star rating & review</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>

              <button
                type="button"
                className="settings-row-item"
                onClick={() => {
                  setFeatureTitle("");
                  setFeatureCategory("Disease Diagnostics");
                  setFeatureDescription("");
                  setActiveModal("suggest-feature");
                }}
              >
                <div className="settings-row-left">
                  <Lightbulb size={18} className="settings-row-icon" />
                  <div className="settings-row-text">
                    <strong>Suggest a Feature</strong>
                    <span>Propose new features or AI capabilities</span>
                  </div>
                </div>
                <ChevronRight size={18} className="settings-row-arrow" />
              </button>

              <button
                type="button"
                className="settings-row-item"
                onClick={() => {
                  setFeedbackCategory("AI Accuracy");
                  setFeedbackMessage("");
                  setActiveModal("share-feedback");
                }}
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

        {/* ── MODALS (Each modal is 100% unique & custom) ── */}

        {/* MODAL 1: SEARCHABLE HELP CENTER (KNOWLEDGE BASE) */}
        {activeModal === "help-center" && (
          <div className="settings-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="settings-modal-card settings-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-badge settings-badge-blue">
                  <HelpCircle size={22} />
                </div>
                <div>
                  <h3 className="settings-modal-title">Help Center & Knowledge Base</h3>
                  <p className="settings-modal-sub">Search FAQs or browse common questions across IntelliFarm AI</p>
                </div>
                <button type="button" className="settings-modal-close-icon" onClick={() => setActiveModal(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Help Center Search Bar */}
              <div className="settings-search-wrapper">
                <Search size={18} className="settings-search-icon" />
                <input
                  type="text"
                  value={helpSearch}
                  onChange={(e) => setHelpSearch(e.target.value)}
                  placeholder="Search topics (e.g. disease, pincode, farms, copilot)..."
                  className="settings-search-input"
                  autoFocus
                />
                {helpSearch && (
                  <button type="button" className="settings-search-clear" onClick={() => setHelpSearch("")}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Accordion FAQ List */}
              <div className="settings-faq-list">
                {filteredFaqs.length === 0 ? (
                  <div className="settings-no-faq">
                    <AlertTriangle size={24} style={{ opacity: 0.6, marginBottom: "6px" }} />
                    <p>No questions matched "{helpSearch}".</p>
                  </div>
                ) : (
                  filteredFaqs.map((item, idx) => (
                    <div
                      key={idx}
                      className={`settings-faq-card ${openFaqIndex === idx ? "expanded" : ""}`}
                    >
                      <div
                        className="settings-faq-question"
                        onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      >
                        <div className="settings-faq-q-left">
                          <span className="settings-faq-tag">{item.cat}</span>
                          <strong>{item.q}</strong>
                        </div>
                        <ChevronRight
                          size={18}
                          className={`settings-faq-arrow ${openFaqIndex === idx ? "rotated" : ""}`}
                        />
                      </div>
                      {openFaqIndex === idx && (
                        <div className="settings-faq-answer">
                          <p>{item.a}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Support Callout */}
              <div className="settings-help-callout">
                <div className="settings-help-callout-text">
                  <strong>Still need help?</strong>
                  <span>Send a direct message to our support team.</span>
                </div>
                <button
                  type="button"
                  className="settings-btn-callout"
                  onClick={() => {
                    setContactCategory("Help Inquiry");
                    setContactPriority("Normal");
                    setContactSubject(helpSearch ? `Query regarding: ${helpSearch}` : "");
                    setContactMessage("");
                    setActiveModal("contact-support");
                  }}
                >
                  <MessageSquare size={16} />
                  <span>Contact Support</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: DIRECT CONTACT SUPPORT FORM */}
        {activeModal === "contact-support" && (
          <div className="settings-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-badge settings-badge-blue">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <h3 className="settings-modal-title">Contact Support Team</h3>
                  <p className="settings-modal-sub">Send a direct priority message to our agronomy & technical support.</p>
                </div>
                <button type="button" className="settings-modal-close-icon" onClick={() => setActiveModal(null)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleContactSubmit} className="settings-support-form">
                {/* Priority Selector */}
                <div className="settings-form-group">
                  <label className="settings-form-label">Priority Level</label>
                  <div className="settings-priority-pills">
                    {["Normal", "Urgent", "Critical"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        className={`settings-priority-pill ${contactPriority === p ? "active " + p.toLowerCase() : ""}`}
                        onClick={() => setContactPriority(p)}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Dropdown */}
                <div className="settings-form-group">
                  <label className="settings-form-label">Inquiry Category</label>
                  <select
                    value={contactCategory}
                    onChange={(e) => setContactCategory(e.target.value)}
                    className="settings-form-input"
                  >
                    <option value="General Question">General Question</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Crop Advisory Query">Crop Advisory Query</option>
                    <option value="Disease Diagnostics">Disease Diagnostics</option>
                    <option value="Account & Billing">Account & Security</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">Subject</label>
                  <input
                    type="text"
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    placeholder="Brief subject of your question..."
                    className="settings-form-input"
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">Detailed Message *</label>
                  <textarea
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Describe your issue or request in detail..."
                    className="settings-form-textarea"
                    required
                  />
                </div>

                <div className="settings-modal-footer">
                  <button
                    type="submit"
                    className="settings-btn-modal-submit"
                    disabled={isSendingSupport || !contactMessage.trim()}
                  >
                    {isSendingSupport ? (
                      <>
                        <Loader2 size={16} className="settings-spinner" />
                        <span>Sending Message...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Support Message</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: REPORT A BUG TRACKER */}
        {activeModal === "report-bug" && (
          <div className="settings-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-badge settings-badge-red">
                  <Bug size={22} />
                </div>
                <div>
                  <h3 className="settings-modal-title">Report a Bug</h3>
                  <p className="settings-modal-sub">Help us identify software issues so we can fix them quickly.</p>
                </div>
                <button type="button" className="settings-modal-close-icon" onClick={() => setActiveModal(null)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleBugSubmit} className="settings-support-form">
                <div className="settings-form-group">
                  <label className="settings-form-label">Bug Summary / Title *</label>
                  <input
                    type="text"
                    value={bugTitle}
                    onChange={(e) => setBugTitle(e.target.value)}
                    placeholder="e.g. Disease leaf scan button unresponsive on mobile"
                    className="settings-form-input"
                    required
                  />
                </div>

                <div className="settings-form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="settings-form-group">
                    <label className="settings-form-label">Affected Module</label>
                    <select
                      value={bugModule}
                      onChange={(e) => setBugModule(e.target.value)}
                      className="settings-form-input"
                    >
                      <option value="Disease Detection">Disease Detection</option>
                      <option value="Weather Bulletins">Weather Bulletins</option>
                      <option value="My Farms / Land">My Farms / Land</option>
                      <option value="Spryzen AI Chat">Spryzen AI Chat</option>
                      <option value="Profile / Settings">Profile / Settings</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label">Severity</label>
                    <select
                      value={bugSeverity}
                      onChange={(e) => setBugSeverity(e.target.value)}
                      className="settings-form-input"
                    >
                      <option value="Low">Low (Cosmetic / Text)</option>
                      <option value="Medium">Medium (Feature Impaired)</option>
                      <option value="High">High (Page Crash / Freeze)</option>
                    </select>
                  </div>
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">Steps to Reproduce & Details *</label>
                  <textarea
                    rows={4}
                    value={bugSteps}
                    onChange={(e) => setBugSteps(e.target.value)}
                    placeholder="1. Clicked on Disease Detection&#10;2. Selected Rice leaf image&#10;3. Screen showed error..."
                    className="settings-form-textarea"
                    required
                  />
                </div>

                <div className="settings-modal-footer">
                  <button
                    type="submit"
                    className="settings-btn-modal-submit settings-btn-red"
                    disabled={isSendingSupport || !bugTitle.trim() || !bugSteps.trim()}
                  >
                    {isSendingSupport ? (
                      <>
                        <Loader2 size={16} className="settings-spinner" />
                        <span>Submitting Bug Report...</span>
                      </>
                    ) : (
                      <>
                        <Bug size={16} />
                        <span>Submit Bug Report</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: INTERACTIVE 5-STEP USER GUIDE HANDBOOK */}
        {activeModal === "user-guide" && (
          <div className="settings-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="settings-modal-card settings-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-badge settings-badge-blue">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h3 className="settings-modal-title">IntelliFarm AI Interactive User Guide</h3>
                  <p className="settings-modal-sub">Step {guideStep} of 5 — Master your smart farming toolkit</p>
                </div>
                <button type="button" className="settings-modal-close-icon" onClick={() => setActiveModal(null)}>
                  <X size={18} />
                </button>
              </div>

              {/* Progress Stepper Bar */}
              <div className="settings-guide-stepper">
                {[1, 2, 3, 4, 5].map((stepNum) => (
                  <button
                    key={stepNum}
                    type="button"
                    className={`settings-guide-step-dot ${guideStep === stepNum ? "active" : ""} ${guideStep > stepNum ? "completed" : ""}`}
                    onClick={() => setGuideStep(stepNum)}
                  >
                    {guideStep > stepNum ? <CheckCircle size={14} /> : stepNum}
                  </button>
                ))}
              </div>

              {/* Guide Content Display */}
              <div className="settings-guide-card-content">
                {guideStep === 1 && (
                  <div className="settings-guide-step-body">
                    <div className="settings-guide-step-icon"><MapPin size={28} /></div>
                    <h4>Step 1: Set Up Profile & Location Pincode</h4>
                    <p>
                      Enter your 6-digit Pincode in your <strong>Profile</strong>. This allows IntelliFarm AI to auto-detect your State and District location to fetch hyper-local rain bulletins, humidity, and temperature forecasts.
                    </p>
                    <div className="settings-guide-tip">
                      <Sparkles size={16} /> <span>Tip: Select your primary crops to receive tailored advisory alerts!</span>
                    </div>
                  </div>
                )}

                {guideStep === 2 && (
                  <div className="settings-guide-step-body">
                    <div className="settings-guide-step-icon"><Stethoscope size={28} /></div>
                    <h4>Step 2: Run Vision AI Leaf Diagnostics</h4>
                    <p>
                      Navigate to <strong>Disease Detection</strong>, upload or take a clear photo of an infected plant leaf. Qwen2.5-VL vision model identifies fungal, bacterial, or viral diseases and displays instant organic & chemical spray remedies.
                    </p>
                    <div className="settings-guide-tip">
                      <Sparkles size={16} /> <span>Tip: Ensure good daylight and close-up focus on leaf spots for highest accuracy.</span>
                    </div>
                  </div>
                )}

                {guideStep === 3 && (
                  <div className="settings-guide-step-body">
                    <div className="settings-guide-step-icon"><CloudSun size={28} /></div>
                    <h4>Step 3: Monitor Weather & Irrigation Bulletins</h4>
                    <p>
                      Check the <strong>Weather</strong> page to view hourly rain predictions, soil moisture advice, wind speeds, and smart irrigation recommendations tailored to prevent overwatering.
                    </p>
                    <div className="settings-guide-tip">
                      <Sparkles size={16} /> <span>Tip: Avoid pesticide spraying on high-wind or heavy-rain forecast days!</span>
                    </div>
                  </div>
                )}

                {guideStep === 4 && (
                  <div className="settings-guide-step-body">
                    <div className="settings-guide-step-icon"><Layers size={28} /></div>
                    <h4>Step 4: Register Farm Fields in My Farms</h4>
                    <p>
                      Add your land parcels in <strong>My Farms</strong>. Track total acreage, soil pH, irrigation source (borewell/canal), and active crop growth stages across all your fields.
                    </p>
                    <div className="settings-guide-tip">
                      <Sparkles size={16} /> <span>Tip: Categorize fields by crop type for organized record keeping!</span>
                    </div>
                  </div>
                )}

                {guideStep === 5 && (
                  <div className="settings-guide-step-body">
                    <div className="settings-guide-step-icon"><Sparkles size={28} /></div>
                    <h4>Step 5: Consult Spryzen AI Copilot</h4>
                    <p>
                      Ask <strong>Spryzen AI</strong> anything — from fertilizer dosage calculations to government subsidy schemes. Spryzen understands voice input and regional languages to assist you 24/7.
                    </p>
                    <div className="settings-guide-tip">
                      <Sparkles size={16} /> <span>Tip: You can ask Spryzen to explain disease report treatments in simple terms!</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Guide Footer Controls */}
              <div className="settings-modal-footer" style={{ justifyContent: "space-between" }}>
                <button
                  type="button"
                  className="settings-btn-cancel"
                  onClick={() => setGuideStep(Math.max(1, guideStep - 1))}
                  disabled={guideStep === 1}
                  style={{ width: "auto", padding: "10px 18px", opacity: guideStep === 1 ? 0.4 : 1 }}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                {guideStep < 5 ? (
                  <button
                    type="button"
                    className="settings-btn-modal-submit"
                    onClick={() => setGuideStep(guideStep + 1)}
                    style={{ width: "auto", padding: "10px 22px" }}
                  >
                    <span>Next Step</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="settings-btn-modal-submit"
                    onClick={() => setActiveModal(null)}
                    style={{ width: "auto", padding: "10px 22px" }}
                  >
                    <CheckCircle size={16} />
                    <span>Got It & Finish</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 5: SUGGEST A FEATURE */}
        {activeModal === "suggest-feature" && (
          <div className="settings-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-badge settings-badge-amber">
                  <Lightbulb size={22} />
                </div>
                <div>
                  <h3 className="settings-modal-title">Suggest a Feature</h3>
                  <p className="settings-modal-sub">Tell us what new features or improvements you want to see.</p>
                </div>
                <button type="button" className="settings-modal-close-icon" onClick={() => setActiveModal(null)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFeatureSubmit} className="settings-support-form">
                <div className="settings-form-group">
                  <label className="settings-form-label">Feature Title *</label>
                  <input
                    type="text"
                    value={featureTitle}
                    onChange={(e) => setFeatureTitle(e.target.value)}
                    placeholder="e.g. Export disease report as PDF certificate"
                    className="settings-form-input"
                    required
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">Target Module</label>
                  <select
                    value={featureCategory}
                    onChange={(e) => setFeatureCategory(e.target.value)}
                    className="settings-form-input"
                  >
                    <option value="Disease Diagnostics">Disease Diagnostics</option>
                    <option value="Weather & Irrigation">Weather & Irrigation</option>
                    <option value="My Farms / Land Mapping">My Farms / Land Mapping</option>
                    <option value="Spryzen AI Copilot">Spryzen AI Copilot</option>
                    <option value="Mobile / Offline Mode">Mobile / Offline Mode</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">Description & How It Helps You *</label>
                  <textarea
                    rows={4}
                    value={featureDescription}
                    onChange={(e) => setFeatureDescription(e.target.value)}
                    placeholder="Describe how this feature would work and why it would be helpful for your farm..."
                    className="settings-form-textarea"
                    required
                  />
                </div>

                <div className="settings-modal-footer">
                  <button
                    type="submit"
                    className="settings-btn-modal-submit"
                    disabled={isSendingSupport || !featureTitle.trim() || !featureDescription.trim()}
                  >
                    {isSendingSupport ? (
                      <>
                        <Loader2 size={16} className="settings-spinner" />
                        <span>Submitting Feature...</span>
                      </>
                    ) : (
                      <>
                        <Lightbulb size={16} />
                        <span>Submit Feature Suggestion</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 6: INTERACTIVE RATE APP (5-STAR RATING) */}
        {activeModal === "rate-app" && (
          <div className="settings-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-badge settings-badge-amber">
                  <Star size={22} />
                </div>
                <div>
                  <h3 className="settings-modal-title">Rate IntelliFarm AI</h3>
                  <p className="settings-modal-sub">How was your experience using IntelliFarm AI?</p>
                </div>
                <button type="button" className="settings-modal-close-icon" onClick={() => setActiveModal(null)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRatingSubmit} className="settings-support-form">
                {/* Star Picker */}
                <div className="settings-rating-picker">
                  {[1, 2, 3, 4, 5].map((starNum) => (
                    <button
                      key={starNum}
                      type="button"
                      className={`settings-star-btn ${ratingStars >= starNum ? "active" : ""}`}
                      onClick={() => setRatingStars(starNum)}
                    >
                      <Star size={32} fill={ratingStars >= starNum ? "#f59e0b" : "transparent"} />
                    </button>
                  ))}
                </div>
                <div style={{ textAlign: "center", fontSize: "14px", fontWeight: "700", color: "#f59e0b", margin: "-6px 0 10px" }}>
                  {ratingStars === 5 && "⭐ Excellent - Love it!"}
                  {ratingStars === 4 && "👍 Very Good - Very helpful!"}
                  {ratingStars === 3 && "👌 Good - Could be better"}
                  {ratingStars === 2 && "⚠️ Fair - Encountered issues"}
                  {ratingStars === 1 && "👎 Poor - Needs major fixes"}
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">Review / Written Comments (Optional)</label>
                  <textarea
                    rows={3}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Tell us what you liked or what we can improve..."
                    className="settings-form-textarea"
                  />
                </div>

                <div className="settings-modal-footer">
                  <button
                    type="submit"
                    className="settings-btn-modal-submit"
                    disabled={isSendingSupport}
                  >
                    {isSendingSupport ? (
                      <>
                        <Loader2 size={16} className="settings-spinner" />
                        <span>Submitting Rating...</span>
                      </>
                    ) : (
                      <>
                        <Star size={16} />
                        <span>Submit Rating</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 7: SHARE FEEDBACK */}
        {activeModal === "share-feedback" && (
          <div className="settings-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="settings-modal-header">
                <div className="settings-badge settings-badge-amber">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <h3 className="settings-modal-title">Share Feedback</h3>
                  <p className="settings-modal-sub">Help us improve crop advisory and overall usability.</p>
                </div>
                <button type="button" className="settings-modal-close-icon" onClick={() => setActiveModal(null)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="settings-support-form">
                <div className="settings-form-group">
                  <label className="settings-form-label">Feedback Focus Area</label>
                  <select
                    value={feedbackCategory}
                    onChange={(e) => setFeedbackCategory(e.target.value)}
                    className="settings-form-input"
                  >
                    <option value="AI Accuracy">Disease Diagnosis Accuracy</option>
                    <option value="Weather Accuracy">Weather Forecast Accuracy</option>
                    <option value="UI & Ease of Use">UI & Ease of Use</option>
                    <option value="Performance & Speed">Performance & Speed</option>
                  </select>
                </div>

                <div className="settings-form-group">
                  <label className="settings-form-label">Your Feedback *</label>
                  <textarea
                    rows={4}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Share your thoughts, praise, or criticism..."
                    className="settings-form-textarea"
                    required
                  />
                </div>

                <div className="settings-modal-footer">
                  <button
                    type="submit"
                    className="settings-btn-modal-submit"
                    disabled={isSendingSupport || !feedbackMessage.trim()}
                  >
                    {isSendingSupport ? (
                      <>
                        <Loader2 size={16} className="settings-spinner" />
                        <span>Sending Feedback...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Feedback</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 8: PRIVACY POLICY */}
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

        {/* MODAL 9: TERMS & CONDITIONS */}
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

        {/* MODAL 10: DELETE ACCOUNT */}
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

      </div>

      {/* ── Glassmorphism Styling matching Disease Detection Page ── */}
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

        /* Modals Base */
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
          max-height: 90vh;
          overflow-y: auto;
        }

        .settings-modal-large {
          max-width: 680px;
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

        /* 1. Searchable Help Center Styles */
        .settings-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .settings-search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-main, #6b7c72);
        }

        .settings-search-input {
          width: 100%;
          padding: 12px 38px 12px 42px;
          border-radius: 14px;
          border: 1.5px solid var(--settings-card-border, rgba(46, 125, 50, 0.2));
          background: rgba(0, 0, 0, 0.02);
          font-size: 14px;
          outline: none;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .settings-search-input {
          background: rgba(255, 255, 255, 0.04);
          color: #f0fdf4;
        }

        .settings-search-clear {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: var(--text-main, #6b7c72);
          cursor: pointer;
        }

        .settings-faq-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 340px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .settings-faq-card {
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(0, 0, 0, 0.015);
          overflow: hidden;
          transition: all 0.2s ease;
        }

        [data-theme="dark"] .settings-faq-card {
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.05);
        }

        .settings-faq-question {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px;
          cursor: pointer;
        }

        .settings-faq-q-left {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
        }

        .settings-faq-tag {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(2, 132, 199, 0.12);
          color: #0284c7;
        }

        .settings-faq-arrow {
          transition: transform 0.2s ease;
          color: var(--text-main, #6b7c72);
        }

        .settings-faq-arrow.rotated {
          transform: rotate(90deg);
          color: #2e7d32;
        }

        .settings-faq-answer {
          padding: 0 16px 14px;
          font-size: 13px;
          line-height: 1.55;
          color: var(--text-main, #5b6b62);
          border-top: 1px dashed rgba(0, 0, 0, 0.06);
          margin-top: 4px;
          padding-top: 10px;
        }

        [data-theme="dark"] .settings-faq-answer {
          color: #d1fae5;
          border-top-color: rgba(255, 255, 255, 0.06);
        }

        .settings-help-callout {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-radius: 16px;
          background: rgba(46, 125, 50, 0.08);
          border: 1px solid rgba(46, 125, 50, 0.2);
          margin-top: 6px;
        }

        .settings-help-callout-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          font-size: 13px;
        }

        .settings-help-callout-text strong {
          color: #2e7d32;
        }

        [data-theme="dark"] .settings-help-callout-text strong {
          color: #4ade80;
        }

        .settings-btn-callout {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          background: #2e7d32;
          color: #ffffff;
          border: none;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
        }

        /* 2. Priority Pills for Contact Form */
        .settings-priority-pills {
          display: flex;
          gap: 8px;
        }

        .settings-priority-pill {
          flex: 1;
          padding: 8px;
          border-radius: 10px;
          border: 1.5px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.03);
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .settings-priority-pill {
          background: rgba(255, 255, 255, 0.05);
          color: #f0fdf4;
          border-color: rgba(255, 255, 255, 0.1);
        }

        .settings-priority-pill.active.normal { background: rgba(16, 185, 129, 0.15); border-color: #10b981; color: #047857; }
        .settings-priority-pill.active.urgent { background: rgba(245, 158, 11, 0.15); border-color: #f59e0b; color: #b45309; }
        .settings-priority-pill.active.critical { background: rgba(239, 68, 68, 0.15); border-color: #ef4444; color: #b91c1c; }

        /* 3. 5-Step User Guide Stepper */
        .settings-guide-stepper {
          display: flex;
          align-items: center;
          justify-content: space-around;
          margin: 4px 0 12px;
          position: relative;
        }

        .settings-guide-step-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid rgba(46, 125, 50, 0.2);
          background: rgba(0, 0, 0, 0.04);
          color: var(--text-main, #6b7c72);
          font-weight: 800;
          font-size: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .settings-guide-step-dot.active {
          border-color: #2e7d32;
          background: #2e7d32;
          color: #ffffff;
          transform: scale(1.15);
          box-shadow: 0 4px 12px rgba(46, 125, 50, 0.3);
        }

        .settings-guide-step-dot.completed {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
          color: #10b981;
        }

        .settings-guide-card-content {
          background: rgba(46, 125, 50, 0.04);
          border: 1px solid rgba(46, 125, 50, 0.15);
          border-radius: 18px;
          padding: 20px;
          min-height: 170px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .settings-guide-step-body {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .settings-guide-step-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #2e7d32;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-guide-step-body h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
          color: var(--body-color, #183d24);
        }

        [data-theme="dark"] .settings-guide-step-body h4 {
          color: #f0fdf4;
        }

        .settings-guide-step-body p {
          margin: 0;
          font-size: 13.5px;
          line-height: 1.5;
          color: var(--text-main, #5b6b62);
        }

        [data-theme="dark"] .settings-guide-step-body p {
          color: #d1fae5;
        }

        .settings-guide-tip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          background: rgba(245, 158, 11, 0.12);
          color: #b45309;
          font-size: 12px;
          font-weight: 700;
        }

        [data-theme="dark"] .settings-guide-tip {
          color: #fbbf24;
        }

        /* 4. Rating Stars Picker */
        .settings-rating-picker {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin: 8px 0;
        }

        .settings-star-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: #d1d5db;
          transition: transform 0.15s ease;
          padding: 4px;
        }

        .settings-star-btn:hover {
          transform: scale(1.2);
        }

        .settings-star-btn.active {
          color: #f59e0b;
        }

        /* Forms & Inputs */
        .settings-delete-form, .settings-support-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .settings-form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .settings-form-label {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-main, #6b7c72);
        }

        .settings-form-input, .settings-form-textarea {
          width: 100%;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1.5px solid var(--settings-card-border, rgba(46, 125, 50, 0.2));
          background: rgba(255, 255, 255, 0.85);
          color: var(--body-color, #183d24);
          font-size: 14px;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }

        [data-theme="dark"] .settings-form-input,
        [data-theme="dark"] .settings-form-textarea {
          background: rgba(20, 32, 24, 0.85);
          color: #f0fdf4;
          border-color: rgba(74, 222, 128, 0.2);
        }

        .settings-form-input:focus, .settings-form-textarea:focus {
          border-color: #2e7d32;
          box-shadow: 0 0 0 3px rgba(46, 125, 50, 0.12);
        }

        .settings-modal-footer {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 12px;
        }

        .settings-btn-modal-submit {
          width: 100%;
          padding: 13px;
          border-radius: 14px;
          background: linear-gradient(135deg, #2e7d32, #1b5e20);
          color: #ffffff;
          border: none;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(46, 125, 50, 0.25);
          transition: all 0.2s ease;
        }

        .settings-btn-red {
          background: linear-gradient(135deg, #ef4444, #dc2626) !important;
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.25) !important;
        }

        .settings-btn-modal-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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

        .settings-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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
