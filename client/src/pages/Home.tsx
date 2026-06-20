import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import Navbar from "../components/Navbar";
import farmHero from "../assets/intellifarm-hero.png";
import { ROUTES } from "../utils/constants";
import { fetchWeatherBundle } from "../services/weatherApi";
import marketData from "../data/marketPrices.json";
import schemes from "../data/schemes.json";
import { MarketPriceItem, Scheme } from "../types";

const testimonials = [
  {
    quote: "IntelliFarm AI changed how I plan my irrigation. Saved 30% water!",
    author: "Rajesh Kumar",
    location: "Nalgonda, Telangana",
  },
  {
    quote: "The disease leaf scanner detected blast disease early, saving my paddy crop.",
    author: "Gurpreet Singh",
    location: "Amritsar, Punjab",
  },
  {
    quote: "Accurate market prices helped me sell my tomatoes at the best rate.",
    author: "Amrita Patil",
    location: "Nashik, Maharashtra",
  },
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [weatherData, setWeatherData] = useState<any>(null);
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const localLocation = localStorage.getItem("location");
  const defaultCity = localLocation ? localLocation.split(",")[0].trim() : "Hyderabad";
  const displayLocation = localLocation || "Hyderabad, Telangana";

  useEffect(() => {
    fetchWeatherBundle({ city: defaultCity })
      .then((res) => {
        setWeatherData(res.data.data);
      })
      .catch((err) => {
        console.error("Home weather fetch failed", err);
      });
  }, [defaultCity]);

  // Testimonials rotation
  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="ag-page ag-home" style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f7faf7 0%, #e9f6e8 100%)", paddingBottom: "60px" }}>
      <Navbar />

      {/* 1. Hero Section */}
      <section
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "40px",
          padding: "80px max(40px, calc((100% - 1200px) / 2))",
          background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,248,240,0.85) 50%, rgba(255,255,255,0.2) 100%), url(${farmHero}) no-repeat center center`,
          backgroundSize: "cover",
          borderRadius: "0 0 32px 32px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.03)",
          flexWrap: "wrap"
        }}
      >
        <motion.div
          style={{ flex: 1, minWidth: "320px", display: "flex", flexDirection: "column", gap: "18px" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span
            style={{
              alignSelf: "flex-start",
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              padding: "6px 12px",
              borderRadius: "20px",
              background: "rgba(46, 125, 50, 0.1)",
              color: "#2e7d32"
            }}
          >
            Agriculture Platform + AI Assistant
          </span>
          <h1 style={{ fontSize: "clamp(36px, 5vw, 54px)", color: "#183d24", fontWeight: 800, margin: 0, lineHeight: 1.15 }}>
            Smart Farming Solutions with <span style={{ color: "#2e7d32" }}>IntelliFarm AI</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#5b6b62", margin: 0, lineHeight: 1.6, maxWidth: "520px" }}>
            AI-powered agriculture assistance for modern farmers. Get instant recommendations on crop planning, disease diagnosis, weather risks, and mandi market prices.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "10px" }}>
            <Link className="glass-btn-primary" style={{ padding: "14px 28px", textDecoration: "none", fontSize: "15px" }} to="/login">Get Started</Link>
            <Link className="glass-btn-secondary" style={{ padding: "14px 28px", textDecoration: "none", fontSize: "15px" }} to={ROUTES.assistant}>Talk to AI Assistant</Link>
          </div>
        </motion.div>

        {/* Live Weather Indicator */}
        <aside
          className="liquid-glass-card"
          style={{
            padding: "24px",
            minWidth: "300px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            border: "1px solid rgba(255,255,255,0.4)"
          }}
        >
          <div>
            <span style={{ fontSize: "12px", color: "#8e918f", fontWeight: 800, textTransform: "uppercase" }}>TODAY'S WEATHER</span>
            <strong style={{ display: "block", fontSize: "18px", color: "#183d24", marginTop: "4px" }}>{displayLocation}</strong>
          </div>
          <strong style={{ fontSize: "36px", color: "#2e7d32" }}>
            {weatherData ? `${Math.round(weatherData.weather.main.temp)}°C` : "32°C"}
          </strong>
          <span style={{ fontSize: "13px", color: "#5b6b62" }}>
            {weatherData
              ? `${weatherData.weather.weather[0].main} | Humidity ${weatherData.weather.main.humidity}% | Rain chance ${weatherData.rainfallProbability ? "High" : "Low"}`
              : "Partly cloudy | Humidity 68% | Rain chance 20%"}
          </span>
        </aside>
      </section>

      {/* 2. Core Features Section */}
      <section style={{ padding: "80px max(20px, calc((100% - 1200px) / 2))" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <span style={{ fontSize: "12px", color: "#2e7d32", fontWeight: 800, textTransform: "uppercase" }}>OUR CAPABILITIES</span>
          <h2 style={{ fontSize: "32px", color: "#183d24", fontWeight: 800, margin: "8px 0 0 0" }}>Features Engineered for Modern Farmers</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {[
            {
              icon: "🚜",
              title: "Farm Management",
              desc: "Register your land fields, record crop details, and track growth progress seamlessly."
            },
            {
              icon: "🍃",
              title: "AI Disease Detection",
              desc: "Instant leaf scanner identifying diseases with Llama Vision model and organic treatments."
            },
            {
              icon: "🌤️",
              title: "Weather Intelligence",
              desc: "Localized microclimate monitoring, humidity risk assessment, and rain watch logs."
            },
            {
              icon: "📈",
              title: "Market Mandi Prices",
              desc: "Track real-time market rates and mandi price trend analysis for smarter crops marketing."
            }
          ].map((feat) => (
            <article key={feat.title} className="liquid-glass-card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <span style={{ fontSize: "32px" }}>{feat.icon}</span>
              <h3 style={{ fontSize: "18px", color: "#183d24", margin: 0, fontWeight: 700 }}>{feat.title}</h3>
              <p style={{ fontSize: "14px", color: "#5b6b62", margin: 0, lineHeight: 1.5 }}>{feat.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 3. AI Disease Scanner & Drop Area */}
      <section style={{ padding: "40px max(20px, calc((100% - 1200px) / 2))" }}>
        <div
          className="liquid-glass-panel"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
            alignItems: "center",
            background: "var(--glass-green-gradient)"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <span style={{ fontSize: "12px", color: "#2e7d32", fontWeight: 800, textTransform: "uppercase" }}>LEAF SCANNER</span>
            <h2 style={{ fontSize: "28px", color: "#183d24", fontWeight: 800, margin: 0 }}>Instant Crop Disease Analysis</h2>
            <p style={{ fontSize: "15px", color: "#5b6b62", margin: 0, lineHeight: 1.6 }}>
              Spot unusual discoloration or wilted spots on your crops? Drag and drop a picture of the affected leaf here. We will instantly trigger AI analysis to diagnose the disease and output prevention checklists.
            </p>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "8px" }}>
              <Link className="glass-btn-primary" style={{ padding: "12px 24px", textDecoration: "none", fontSize: "14px" }} to="/disease-detection">Open Analyzer</Link>
              <Link className="glass-btn-secondary" style={{ padding: "12px 24px", textDecoration: "none", fontSize: "14px" }} to="/disease-info">Browse Database</Link>
            </div>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = () => {
                  localStorage.setItem("temp_disease_image", reader.result as string);
                  navigate("/disease-detection");
                };
                reader.readAsDataURL(file);
              }
            }}
            onClick={() => {
              const uploader = document.getElementById("home-leaf-uploader-redesign");
              if (uploader) uploader.click();
            }}
            style={{
              border: "2px dashed rgba(46, 125, 50, 0.3)",
              borderRadius: "16px",
              padding: "50px 30px",
              textAlign: "center",
              cursor: "pointer",
              background: "rgba(255, 255, 255, 0.4)",
              boxShadow: "0 10px 30px rgba(46, 125, 50, 0.05)",
              transition: "all 0.25s"
            }}
          >
            <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>📸</span>
            <strong style={{ fontSize: "16px", color: "#2e7d32", display: "block", marginBottom: "4px" }}>Drag & Drop Leaf Photo Here</strong>
            <span style={{ fontSize: "13px", color: "#666" }}>or click to browse from files</span>
            <input
              id="home-leaf-uploader-redesign"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    localStorage.setItem("temp_disease_image", reader.result as string);
                    navigate("/disease-detection");
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>
        </div>
      </section>

      {/* 4. Mandi Prices & Market Section */}
      <section style={{ padding: "60px max(20px, calc((100% - 1200px) / 2))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "32px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <span style={{ fontSize: "12px", color: "#2e7d32", fontWeight: 800, textTransform: "uppercase" }}>MARKET INTELLIGENCE</span>
            <h2 style={{ fontSize: "28px", color: "#183d24", fontWeight: 800, margin: "4px 0 0 0" }}>Live Mandi Price Overview</h2>
          </div>
          <Link className="glass-btn-secondary" style={{ padding: "8px 16px", textDecoration: "none", fontSize: "13px" }} to="/market-prices">View All Market Data</Link>
        </div>

        <div className="liquid-glass-panel" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(46, 125, 50, 0.05)", borderBottom: "1px solid rgba(46,125,50,0.1)" }}>
                  <th style={{ padding: "16px 24px", color: "#183d24", fontWeight: 800 }}>Crop</th>
                  <th style={{ padding: "16px 24px", color: "#183d24", fontWeight: 800 }}>Mandi (Market)</th>
                  <th style={{ padding: "16px 24px", color: "#183d24", fontWeight: 800 }}>State</th>
                  <th style={{ padding: "16px 24px", color: "#183d24", fontWeight: 800 }}>Price per Quintal</th>
                  <th style={{ padding: "16px 24px", color: "#183d24", fontWeight: 800 }}>Weekly Trend</th>
                </tr>
              </thead>
              <tbody>
                {(marketData as MarketPriceItem[]).slice(0, 4).map((item, index) => (
                  <tr key={`${item.crop}-${item.market}`} style={{ borderBottom: index === 3 ? "none" : "1px solid rgba(46,125,50,0.06)" }}>
                    <td style={{ padding: "16px 24px", fontWeight: 700, color: "#183d24" }}>{item.crop}</td>
                    <td style={{ padding: "16px 24px", color: "#5b6b62" }}>{item.market}</td>
                    <td style={{ padding: "16px 24px", color: "#5b6b62" }}>{item.state}</td>
                    <td style={{ padding: "16px 24px", color: "#2e7d32", fontWeight: 800 }}>Rs {item.price}</td>
                    <td style={{ padding: "16px 24px", fontWeight: 700, color: item.trend >= 0 ? "#2e7d32" : "#d32f2f" }}>
                      {item.trend >= 0 ? "+" : ""}{item.trend}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 5. Government Schemes Section */}
      <section style={{ padding: "60px max(20px, calc((100% - 1200px) / 2))" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span style={{ fontSize: "12px", color: "#2e7d32", fontWeight: 800, textTransform: "uppercase" }}>GOVERNMENT SUPPORT</span>
          <h2 style={{ fontSize: "28px", color: "#183d24", fontWeight: 800, margin: "4px 0 0 0" }}>Active Schemes & Subsidies</h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
          {(schemes as Scheme[]).slice(0, 3).map((scheme) => (
            <article key={scheme.name} className="liquid-glass-card" style={{ padding: "28px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: 800, color: "#2e7d32", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>
                  {scheme.category} | {scheme.state}
                </span>
                <h3 style={{ fontSize: "16px", color: "#183d24", margin: "0 0 8px 0", fontWeight: 700 }}>{scheme.name}</h3>
                <p style={{ fontSize: "13px", color: "#5b6b62", margin: 0, lineHeight: 1.5 }}>{scheme.detail}</p>
                <p style={{ fontSize: "13px", color: "#333", margin: "12px 0 0 0" }}>
                  <strong>Eligibility:</strong> {scheme.eligibility}
                </p>
              </div>
              <a
                href={scheme.link}
                target="_blank"
                rel="noreferrer"
                className="glass-btn-secondary"
                style={{ padding: "8px 16px", alignSelf: "flex-start", textDecoration: "none", fontSize: "13px" }}
              >
                Apply Details
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* 6. Testimonials Slider */}
      <section style={{ padding: "60px max(20px, calc((100% - 1200px) / 2))" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span style={{ fontSize: "12px", color: "#2e7d32", fontWeight: 800, textTransform: "uppercase" }}>FARMER REVIEWS</span>
          <h2 style={{ fontSize: "28px", color: "#183d24", fontWeight: 800, margin: "4px 0 0 0" }}>Trusted Across the Fields</h2>
        </div>

        <div style={{ maxWidth: "600px", margin: "0 auto", position: "relative" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
              className="liquid-glass-panel"
              style={{ padding: "36px", textAlign: "center" }}
            >
              <span style={{ fontSize: "40px", color: "#2e7d32", opacity: 0.2, display: "block", height: "30px", lineHeight: "1" }}>“</span>
              <p style={{ fontSize: "16px", fontStyle: "italic", color: "#183d24", margin: "0 0 20px 0", lineHeight: 1.6 }}>
                {testimonials[testimonialIndex].quote}
              </p>
              <strong style={{ color: "#2e7d32", display: "block" }}>{testimonials[testimonialIndex].author}</strong>
              <span style={{ fontSize: "13px", color: "#666" }}>{testimonials[testimonialIndex].location}</span>
            </motion.div>
          </AnimatePresence>
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setTestimonialIndex(idx)}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  border: "none",
                  background: testimonialIndex === idx ? "#2e7d32" : "rgba(46, 125, 50, 0.2)",
                  cursor: "pointer",
                  padding: 0
                }}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA Section */}
      <section style={{ padding: "40px max(20px, calc((100% - 1200px) / 2))" }}>
        <div className="liquid-glass-panel" style={{ textAlign: "center", padding: "60px 20px", background: "linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(15, 118, 110, 0.1) 100%)" }}>
          <h2 style={{ fontSize: "32px", color: "#183d24", fontWeight: 800, margin: "0 0 12px 0" }}>Start Farming Smarter Today</h2>
          <p style={{ fontSize: "16px", color: "#5b6b62", margin: "0 0 24px 0", maxWidth: "560px", marginLeft: "auto", marginRight: "auto" }}>
            Create your free account, register your crops, and interact with our agronomist-grade AI assistant.
          </p>
          <Link className="glass-btn-primary" style={{ padding: "14px 36px", textDecoration: "none", fontSize: "15px" }} to="/login">Join IntelliFarm AI</Link>
        </div>
      </section>

      {/* 8. Footer */}
      <footer style={{ padding: "40px max(20px, calc((100% - 1200px) / 2))", borderTop: "1px solid rgba(46, 125, 50, 0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", fontSize: "20px", color: "#183d24" }}>IntelliFarm AI</h2>
          <p style={{ margin: 0, fontSize: "13px", color: "#5b6b62" }}>Smart agriculture services for better farm decisions.</p>
        </div>
        <div>
          <span style={{ fontSize: "13px", color: "#8e918f", display: "block" }}>SUPPORT CONTACT</span>
          <strong style={{ color: "#183d24" }}>support@intellifarm.ai</strong>
        </div>
      </footer>
    </main>
  );
};

export default Home;
