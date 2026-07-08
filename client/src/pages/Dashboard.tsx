import React from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useAuth } from "../context/AuthContext";
import farmLogo from "../assets/intellifarm-icon.png";
import {
  Sun,
  CloudSun,
  Leaf
} from "lucide-react";

const Dashboard: React.FC = () => {
  const { farmer } = useAuth() as any;

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <MainLayout
      eyebrow=""
      title=""
      subtitle=""
      actions={<Link className="glass-btn-primary" style={{ textDecoration: "none" }} to="/assistant">Ask AI Assistant</Link>}
      isDashboard={true}
    >
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Floating Orbs (Behind everything) */}
        <div style={{ position: "absolute", top: "40px", left: "-60px", width: "350px", height: "350px", borderRadius: "50%", background: "rgba(47, 184, 107, 0.05)", filter: "blur(110px)", zIndex: 0, pointerEvents: "none" }}></div>
        <div style={{ position: "absolute", top: "40%", left: "35%", width: "300px", height: "300px", borderRadius: "50%", background: "rgba(56, 189, 248, 0.04)", filter: "blur(110px)", zIndex: 0, pointerEvents: "none" }}></div>
        <div style={{ position: "absolute", bottom: "80px", right: "-60px", width: "380px", height: "380px", borderRadius: "50%", background: "rgba(47, 184, 107, 0.05)", filter: "blur(120px)", zIndex: 0, pointerEvents: "none" }}></div>

        {/* Hero Section */}
        <section className="hero-banner">
          {/* Floating background decorations */}
          <Leaf className="hero-decoration" style={{ top: "10%", left: "15%", width: 22, height: 22, color: "#2FB86B", animationDelay: "1s" }} />
          <Sun className="hero-decoration" style={{ bottom: "15%", left: "5%", width: 22, height: 22, color: "#FF9F43", animationDelay: "3s" }} />
          <CloudSun className="hero-decoration" style={{ top: "25%", left: "45%", width: 22, height: 22, color: "#0288D1", animationDelay: "5s" }} />

          <div className="hero-left">
            <span className="hero-greeting">
              {getGreeting()}, {farmer?.name}!
            </span>
            <h1 className="hero-title">
              Welcome to <span style={{ color: "#2FB86B" }}>IntelliFarm AI</span>
            </h1>
            <p className="hero-description" style={{ marginBottom: 0 }}>
              Access smart farming diagnostics, weather forecasting, and real-time market intelligence.
            </p>
          </div>

          <div className="hero-right">
            <img
              src={farmLogo}
              alt="IntelliFarm AI Logo"
              className="hero-image"
              style={{
                maxHeight: "180px",
                maxWidth: "180px",
                filter: "drop-shadow(0 8px 30px rgba(47, 184, 107, 0.2))",
                animation: "imageFloat 6s ease-in-out infinite"
              }}
            />
          </div>
        </section>

      </div>
    </MainLayout>
  );
};

export default Dashboard;
