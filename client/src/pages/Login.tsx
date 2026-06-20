import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../utils/supabaseClient";
import farmLogo from "../assets/intellifarm-icon.png";

// SVGs and Icons
const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const LeafIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 1 9.8a7 7 0 0 1-9 8.2z" />
    <path d="M9 22v-4h-4" />
  </svg>
);

const MarketIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e53935" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#e53935" strokeWidth="2" />
    <path d="M7 16l4-4 3 3 4-5" />
  </svg>
);

const WeatherIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffb703" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v2M4.22 4.22l1.42 1.42M1 12h2M21 12h2M18.36 5.64l1.42-1.42" />
    <path d="M20 17.58A6 6 0 1 1 8 16A7 7 0 0 1 21 16Z" fill="#ffffff" stroke="#48cae4" strokeWidth="2" />
  </svg>
);

const MailIcon = () => (
  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = () => (
  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UserIcon = () => (
  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MapIcon = () => (
  <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const dynamicReviews = [
  { quote: "IntelliFarm AI changed how I plan my irrigation. Saved 30% water!", author: "Rajesh Kumar", location: "Paddy Farmer • Nalgonda, Telangana", initials: "RK" },
  { quote: "AI disease detection caught powdery mildew early. Game changer!", author: "Priya Singh", location: "Wheat Farmer • Punjab", initials: "PS" },
  { quote: "Market prices updated in real-time. Never got cheated again.", author: "Amrit Patel", location: "Tomato Farmer • Gujarat", initials: "AP" },
  { quote: "Weather alerts saved my tomato crop from frost!", author: "Deepak Sharma", location: "Apple Orchardist • Himachal Pradesh", initials: "DS" },
  { quote: "Crop recommendations helped me increase yield by 25%.", author: "Sanjay Desai", location: "Sugarcane Farmer • Maharashtra", initials: "SD" },
  { quote: "Finally got reliable soil health insights for my farm.", author: "Kavya Nair", location: "Spice Grower • Kerala", initials: "KN" },
  { quote: "The fertilizer optimization saved me ₹15,000 per season!", author: "Vikram Reddy", location: "Horticulturist • Telangana", initials: "VR" },
  { quote: "Farm analytics dashboard shows everything I need at a glance.", author: "Anjali Verma", location: "Potato Farmer • Uttar Pradesh", initials: "AV" },
  { quote: "Connected with 50+ farmers in my region through the platform.", author: "Harpreet Singh", location: "Dairy Farmer • Haryana", initials: "HS" },
  { quote: "30-day weather forecast helped me plan irrigation perfectly.", author: "Ramesh Kumar", location: "Mustard Farmer • Rajasthan", initials: "RK" },
  { quote: "95%+ accuracy in disease detection beats any expert!", author: "Meera Gupta", location: "Soybean Farmer • Madhya Pradesh", initials: "MG" },
  { quote: "Reduced crop losses by 35% using AI recommendations.", author: "Suresh Rao", location: "Coffee Planter • Karnataka", initials: "SR" },
  { quote: "Real-time pest alerts saved my cotton crop from damage.", author: "Fatima Khan", location: "Cotton Farmer • Andhra Pradesh", initials: "FK" },
  { quote: "Market intelligence helped me sell at best possible price.", author: "Arjun Nambiar", location: "Rice Farmer • Tamil Nadu", initials: "AN" },
  { quote: "Mobile app lets me monitor farm even while away.", author: "Neha Patel", location: "Groundnut Farmer • Gujarat", initials: "NP" },
  { quote: "Government schemes finder helped me get ₹50,000 subsidy!", author: "Mohan Lal", location: "Wheat Farmer • Rajasthan", initials: "ML" },
  { quote: "Farm expense tracker shows exact profit margins now.", author: "Sneha Desai", location: "Karnataka", initials: "SD" },
  { quote: "Community forums connected me with experienced farmers.", author: "Rajiv Sharma", location: "Punjab", initials: "RS" },
  { quote: "Water conservation tips reduced usage by 40% on my farm.", author: "Padma Kumari", location: "Andhra Pradesh", initials: "PK" },
  { quote: "Predictive yield forecasting helps me plan better.", author: "Chandan Singh", location: "Bihar", initials: "CS" },
  { quote: "Organic farming compliance made easy with checklist.", author: "Lakshmi Devi", location: "Odisha", initials: "LD" },
  { quote: "Soil nutrient analysis recommendations boosted my yields.", author: "Nagaraju", location: "Telangana", initials: "NA" },
  { quote: "Marketplace to sell directly cut out middlemen completely.", author: "Aarav Patel", location: "Gujarat", initials: "AP" },
  { quote: "Crop rotation planning saved my soil from depletion.", author: "Divya Sharma", location: "Himachal Pradesh", initials: "DS" },
  { quote: "Alert system caught leaf rust 5 days before spread.", author: "Bhavna Singh", location: "Punjab", initials: "BS" },
  { quote: "Historical yield analysis helped identify best practices.", author: "Kiran Kumar", location: "Karnataka", initials: "KK" },
  { quote: "Educational resources from experts at my fingertips.", author: "Anita Verma", location: "Uttar Pradesh", initials: "AV" },
  { quote: "24/7 AI farm consultant answered all my questions instantly.", author: "Jatin Reddy", location: "Telangana", initials: "JR" },
  { quote: "Carbon footprint tracking helped me be sustainable.", author: "Geeta Singh", location: "Haryana", initials: "GS" },
  { quote: "Smart irrigation automation saved 2 hours daily!", author: "Vikram Patel", location: "Gujarat", initials: "VP" },
  { quote: "Price forecasting helped me decide when to sell.", author: "Sunita Sharma", location: "Rajasthan", initials: "SS" },
  { quote: "Multi-farm monitoring from one dashboard is convenient.", author: "Ravi Kumar", location: "Maharashtra", initials: "RK" },
  { quote: "Hyperlocal weather radar saved my winter vegetables.", author: "Hema Nair", location: "Kerala", initials: "HN" },
  { quote: "Subsidy eligibility checker revealed ₹1 lakh I missed!", author: "Anil Desai", location: "Karnataka", initials: "AD" },
  { quote: "Free soil testing recommendations improved my planning.", author: "Bijay Singh", location: "Bihar", initials: "BS" },
  { quote: "Livestock management tools help track my cattle health.", author: "Chitra Gupta", location: "Madhya Pradesh", initials: "CG" },
  { quote: "Export data features make record-keeping simple.", author: "Dhruv Patel", location: "Gujarat", initials: "DP" },
  { quote: "Pest management strategies prevented major outbreak.", author: "Elina Sharma", location: "Himachal Pradesh", initials: "ES" },
  { quote: "Integrated pest management reduced chemical use by 50%.", author: "Farhan Khan", location: "Andhra Pradesh", initials: "FK" },
  { quote: "Harvest timing optimization gave me premium prices.", author: "Girish Kumar", location: "Karnataka", initials: "GK" },
  { quote: "Real-time crop comparison helps choose best varieties.", author: "Harsha Reddy", location: "Telangana", initials: "HR" },
  { quote: "Sustainability score motivated me to farm better.", author: "Indira Devi", location: "Odisha", initials: "ID" },
  { quote: "Know best planting dates feature never fails.", author: "Jagdeep Singh", location: "Punjab", initials: "JS" },
  { quote: "Monitor crop growth stages daily with my phone.", author: "Kavya Sharma", location: "Rajasthan", initials: "KS" },
  { quote: "Got alerts 5 days before optimal harvest. Perfect timing!", author: "Lokesh Kumar", location: "Maharashtra", initials: "LK" },
  { quote: "Farm finance planning tool helped me get bank loan.", author: "Mani Reddy", location: "Telangana", initials: "MR" },
  { quote: "Weather pattern analysis helps predict future trends.", author: "Neelam Verma", location: "Uttar Pradesh", initials: "NV" },
  { quote: "Reduced chemical fertilizer use by 60% per recommendations.", author: "Omkar Singh", location: "Haryana", initials: "OS" },
  { quote: "Plant health scoring system is incredibly accurate.", author: "Preeti Patel", location: "Gujarat", initials: "PP" },
  { quote: "Carbon-neutral farming setup guided by platform.", author: "Quincy Kumar", location: "Kerala", initials: "QK" },
  { quote: "Revolutionized my farm management completely!", author: "Rajendra Singh", location: "Bihar", initials: "RS" }
];

const Login: React.FC = () => {
  const { isAuthenticated, loading: authLoading, login, register, loginWithGoogle } = useAuth() as any;
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isResetSending, setIsResetSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    pincode: "",
    place: "",
  });
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successState, setSuccessState] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Mouse tilt parallax rotation (capped at 2 degrees max)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const rotateX = -(y / (rect.height / 2)) * 2;
    const rotateY = (x / (rect.width / 2)) * 2;
    
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setForm((prev) => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Rotate customer comment review every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % dynamicReviews.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch place from pincode
  const fetchPlaceFromPincode = async (pincode: string) => {
    if (pincode.length < 5) return;
    setPincodeLoading(true);
    try {
      // Using geolocation API to get place from pincode
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );
      const data = await response.json();
      if (data[0]?.PostOffice?.[0]) {
        const district = data[0].PostOffice[0].District;
        const state = data[0].PostOffice[0].State;
        setForm((prev) => ({ ...prev, place: `${district}, ${state}` }));
      }
    } catch (error) {
      console.log("Could not fetch place from pincode");
    } finally {
      setPincodeLoading(false);
    }
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !successState) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate, successState]);

  const updateField = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (errorMsg) setErrorMsg(null);
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    
    // Auto-fetch place when pincode is entered
    if (name === "pincode" && value.length === 6) {
      fetchPlaceFromPincode(value);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to initialize Google Login");
      toast.error(error.message || "Failed to initialize Google Login");
    }
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.email) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    setIsResetSending(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Password reset link sent! Check your inbox.");
      setMode("login");
    } catch (error: any) {
      setErrorMsg(error.message || "Failed to trigger password reset.");
    } finally {
      setIsResetSending(false);
    }
  };

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    try {
      if (mode === "register") {
        // Validate passwords match
        if (form.password !== form.confirmPassword) {
          setErrorMsg("Passwords do not match. Please try again.");
          return;
        }
        await register({
          name: form.name,
          email: form.email,
          password: form.password,
          location: form.place,
          pincode: form.pincode,
          cropsInterested: ["Paddy", "Tomato", "Maize"],
        });
        
        // Show success state for 1 second
        setSuccessState(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        await login({ email: form.email, password: form.password });
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", form.email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        
        // Show success state for 1 second
        setSuccessState(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (error: any) {
      console.error(error);
      const isInvalidCreds = error.message?.includes("Invalid login credentials") || 
                             error.response?.data?.message?.includes("Invalid credentials") ||
                             error.message?.includes("invalid");
      const msg = isInvalidCreds 
        ? "The email or password entered is incorrect. Please try again."
        : (error.response?.data?.message || error.message || "Authentication failed. Please verify your credentials.");
      setErrorMsg(msg);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "transparent" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    switch (score) {
      case 1:
        return { score, label: "Weak", color: "#e53935" };
      case 2:
      case 3:
        return { score, label: "Medium", color: "#fdd835" };
      case 4:
        return { score, label: "Strong", color: "#4caf50" };
      default:
        return { score: 0, label: "Very Weak", color: "#d32f2f" };
    }
  };

  const strength = getPasswordStrength(form.password);
  const loading = authLoading || isResetSending;

  return (
    <motion.div 
      className="login-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div 
        className="login-left"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="animated-overlay"></div>

        {/* Behind hero: green orb, blur 150px, opacity 0.10, 400px size */}
        <div style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "#2e7d32",
          filter: "blur(150px)",
          opacity: 0.10,
          top: "30%",
          left: "20%",
          pointerEvents: "none",
          zIndex: 0
        }}></div>

        <motion.div 
          className="login-left-inner"
          animate={{ rotateX: tilt.x, rotateY: tilt.y }}
          transition={{ type: "tween", ease: "easeOut", duration: 0.15 }}
        >
          <div className="brand">
            <img src={farmLogo} alt="IntelliFarm Logo" className="brand-logo" />
            <div>
              <h2><span className="brand-white">Intelli</span><span className="brand-green">Farm AI</span></h2>
              <p>Smart Farming. Better Decisions.</p>
            </div>
          </div>
          
          <div className="login-left-content">
            <h1>Welcome to <br /><span style={{ color: "#ffffff", WebkitTextFillColor: "#ffffff" }}>Intelli</span><span>Farm AI</span></h1>
            <div className="green-bar"></div>
            <p className="hero-desc">
              Your intelligent farming companion for better decisions, higher yields, and sustainable agriculture.
            </p>

            {/* Aligned Vertical Features Stack */}
            <div className="feature-cards-stack" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <motion.div 
                className="feature-card-glass"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{
                  y: { type: "spring", stiffness: 300, damping: 20 },
                  default: { duration: 0.4, delay: 0.1 }
                }}
              >
                <div className="card-avatar">
                  <LeafIcon />
                </div>
                <div>
                  <h4>Disease Detection</h4>
                  <p>AI-powered leaf scanning & diagnosis.</p>
                </div>
              </motion.div>

              <motion.div 
                className="feature-card-glass"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{
                  y: { type: "spring", stiffness: 300, damping: 20 },
                  default: { duration: 0.4, delay: 0.2 }
                }}
              >
                <div className="card-avatar" style={{ background: "rgba(230, 57, 70, 0.15)", border: "1.5px solid rgba(230, 57, 70, 0.3)" }}>
                  <MarketIcon />
                </div>
                <div>
                  <h4>Market Intelligence</h4>
                  <p>Real-time crop prices & daily trends.</p>
                </div>
              </motion.div>

              <motion.div 
                className="feature-card-glass"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{
                  y: { type: "spring", stiffness: 300, damping: 20 },
                  default: { duration: 0.4, delay: 0.3 }
                }}
              >
                <div className="card-avatar" style={{ background: "rgba(255, 183, 3, 0.15)", border: "1.5px solid rgba(255, 183, 3, 0.3)" }}>
                  <WeatherIcon />
                </div>
                <div>
                  <h4>Weather Alerts</h4>
                  <p>Hyper-local forecasts & smart planning.</p>
                </div>
              </motion.div>
            </div>

            {/* Single Premium Testimonial Card */}
            <div className="testimonial-card-premium" style={{ marginTop: "40px" }}>
              <div className="testimonial-header">
                <div className="testimonial-avatar">{dynamicReviews[currentReviewIndex].initials}</div>
                <div className="testimonial-meta">
                  <strong>{dynamicReviews[currentReviewIndex].author}</strong>
                  <span>{dynamicReviews[currentReviewIndex].location}</span>
                </div>
              </div>
              <p className="testimonial-text">
                "{dynamicReviews[currentReviewIndex].quote}"
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="login-right">
        {/* Behind login card: animated green orbs */}
        <div className="animated-orb-1"></div>
        <div className="animated-orb-2"></div>

        <div className="login-form-container">
          <AnimatePresence mode="wait">
            {successState ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 0",
                  textAlign: "center"
                }}
              >
                <div className="success-checkmark-circle">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#52b788" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="success-title">✓ Authentication successful</h3>
                <p className="success-subtitle">Redirecting to dashboard...</p>
              </motion.div>
            ) : (
              <motion.div
                key="auth-card"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                style={{ display: "flex", flexDirection: "column", gap: "28px" }}
              >
                <div className="badge-container">
                  <div className="badge-circle">
                    <LeafIcon />
                  </div>
                </div>

                <div className="login-right-header">
                  <h2>
                    {mode === "login" 
                      ? "Welcome Back" 
                      : mode === "register" 
                      ? "Create Account" 
                      : "Reset Password"}
                  </h2>
                  <p>
                    {mode === "login" 
                      ? "Sign in to continue to your dashboard" 
                      : mode === "register"
                      ? "Join our community of farmers using AI for better yield" 
                      : "Enter your email to receive recovery instructions"}
                  </p>
                </div>

                {/* Local glass error card */}
                <AnimatePresence>
                  {errorMsg && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="login-error-card-glass">
                        <div className="error-title-row">
                          <span className="error-icon">⚠</span>
                          <strong>Login Failed</strong>
                        </div>
                        <p className="error-description">
                          {errorMsg}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {mode !== "forgot" && (
                  <>
                    <motion.button 
                      type="button" 
                      className="google-btn" 
                      onClick={handleGoogleLogin} 
                      disabled={loading}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                    >
                      <GoogleIcon />
                      <span>Continue with Google</span>
                    </motion.button>

                    <div className="login-divider">
                      <span>OR</span>
                    </div>
                  </>
                )}

                {mode === "forgot" ? (
                  <form onSubmit={handleForgotPassword} className="login-form">
                    <div className="form-group-field">
                      <label htmlFor="email-input">Email Address</label>
                      <div className="input-wrapper">
                        <MailIcon />
                        <input 
                          id="email-input"
                          type="email"
                          name="email" 
                          value={form.email} 
                          onChange={updateField} 
                          placeholder="Enter your email" 
                          required 
                        />
                      </div>
                    </div>

                    <motion.button 
                      type="submit" 
                      className="signin-btn" 
                      disabled={loading}
                      whileHover={{ translateY: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                    >
                      {loading ? (
                        <span className="btn-spinner-container">
                          <span className="btn-spinner"></span>
                          <span>Sending...</span>
                        </span>
                      ) : (
                        <>
                          <span>Send Reset Email</span>
                          <ArrowRightIcon />
                        </>
                      )}
                    </motion.button>

                    <div className="login-right-footer">
                      <button 
                        type="button" 
                        className="switch-mode-btn"
                        onClick={() => setMode("login")}
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={submitAuth} className="login-form">
                    {mode === "register" && (
                      <>
                        <div className="form-group-field" style={{ marginBottom: "2px" }}>
                          <label htmlFor="name-input">Name</label>
                          <div className="input-wrapper">
                            <UserIcon />
                            <input 
                              id="name-input"
                              name="name" 
                              value={form.name} 
                              onChange={updateField} 
                              placeholder="Enter your name" 
                              required={mode === "register"}
                            />
                          </div>
                        </div>
                        <div className="form-group-field" style={{ marginBottom: "2px" }}>
                          <label htmlFor="pincode-input">Pincode</label>
                          <div className="input-wrapper">
                            <MapIcon />
                            <input 
                              id="pincode-input"
                              name="pincode" 
                              value={form.pincode} 
                              onChange={updateField} 
                              placeholder="Enter your pincode" 
                              maxLength={6}
                              required={mode === "register"}
                            />
                          </div>
                          {pincodeLoading && <p style={{ fontSize: "0.75rem", marginTop: "4px", color: "#666" }}>Finding your location...</p>}
                        </div>
                        {form.place && (
                          <div className="form-group-field" style={{ marginBottom: "2px" }}>
                            <label htmlFor="place-input">Place (Auto-filled)</label>
                            <div className="input-wrapper">
                              <MapIcon />
                              <input 
                                id="place-input"
                                type="text"
                                value={form.place} 
                                placeholder="Place" 
                                disabled
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="form-group-field" style={{ marginBottom: "2px" }}>
                      <label htmlFor="email-input">Email Address</label>
                      <div className="input-wrapper">
                        <MailIcon />
                        <input 
                          id="email-input"
                          type="email"
                          name="email" 
                          value={form.email} 
                          onChange={updateField} 
                          placeholder="Enter your email" 
                          required 
                        />
                      </div>
                    </div>

                    <div className="form-group-field" style={{ marginBottom: "2px" }}>
                      <label htmlFor="password-input">Password</label>
                      <div className="input-wrapper">
                        <LockIcon />
                        <input 
                          id="password-input"
                          type={showPassword ? "text" : "password"} 
                          name="password" 
                          value={form.password} 
                          onChange={updateField} 
                          placeholder="Enter your password" 
                          required 
                        />
                        <button 
                          type="button" 
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                        </button>
                      </div>

                      {/* Password Strength Indicator */}
                      {mode === "register" && form.password && (
                        <div className="password-strength-container" style={{ marginTop: "4px" }}>
                          <div className="strength-meter-bar">
                            <div 
                              className="strength-fill" 
                              style={{ 
                                width: `${(strength.score / 4) * 100}%`,
                                backgroundColor: strength.color
                              }}
                            ></div>
                          </div>
                          <span className="strength-label" style={{ color: strength.color, display: "block" }}>
                            Password Strength: <strong>{strength.label}</strong>
                          </span>
                        </div>
                      )}
                    </div>

                    {mode === "register" && (
                      <div className="form-group-field" style={{ marginBottom: "2px" }}>
                        <label htmlFor="confirm-password-input">Re-enter Password</label>
                        <div className="input-wrapper">
                          <LockIcon />
                          <input 
                            id="confirm-password-input"
                            type={showConfirmPassword ? "text" : "password"} 
                            name="confirmPassword" 
                            value={form.confirmPassword} 
                            onChange={updateField} 
                            placeholder="Re-enter your password" 
                            required={mode === "register"}
                          />
                          <button 
                            type="button" 
                            className="password-toggle"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? <EyeIcon /> : <EyeOffIcon />}
                          </button>
                        </div>
                        {mode === "register" && form.password && form.confirmPassword && (
                          <span style={{ fontSize: "0.75rem", marginTop: "4px", display: "block", color: form.password === form.confirmPassword ? "#4caf50" : "#e53935" }}>
                            {form.password === form.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                          </span>
                        )}
                      </div>
                    )}

                    {mode === "login" && (
                      <div className="login-actions-row" style={{ justifyContent: "flex-end" }}>
                        <a 
                          href="#forgot" 
                          className="forgot-link" 
                          onClick={(e) => { 
                            e.preventDefault(); 
                            setMode("forgot"); 
                          }}
                        >
                          Forgot password?
                        </a>
                      </div>
                    )}

                    <motion.button 
                      type="submit" 
                      className="signin-btn" 
                      disabled={loading}
                      whileHover={{ translateY: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                    >
                      {loading ? (
                        <span className="btn-spinner-container">
                          <span className="btn-spinner"></span>
                          <span>{mode === "login" ? "Signing In..." : "Registering..."}</span>
                        </span>
                      ) : (
                        <>
                          <span>{mode === "login" ? "Sign In" : "Register"}</span>
                          <ArrowRightIcon />
                        </>
                      )}
                    </motion.button>
                  </form>
                )}

                <div className="login-right-footer">
                  <p>
                    {mode === "login" 
                      ? "New to IntelliFarm AI? " 
                      : mode === "register" 
                      ? "Already have an account? " 
                      : ""}
                    {mode !== "forgot" && (
                      <button 
                        type="button" 
                        className="switch-mode-btn"
                        onClick={() => setMode(mode === "login" ? "register" : "login")}
                      >
                        {mode === "login" ? "Create an account" : "Sign in here"}
                      </button>
                    )}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </motion.div>
  );
};

export default Login;
