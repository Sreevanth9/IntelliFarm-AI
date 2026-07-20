import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const MainLayout = ({ children, eyebrow, title, subtitle, actions = null, isDashboard = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close drawer on route change (navigation via browser back/forward too)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close drawer on resize to desktop — prevents stale body-lock state
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1025) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="ag-layout-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={`ag-main-container ${isDashboard ? "dashboard-main-container" : ""}`}>
        <Navbar onMenuClick={() => setSidebarOpen((o) => !o)} sidebarOpen={sidebarOpen} />

        <main
          className="ag-page"
          style={{ flex: 1, display: "flex", flexDirection: "column", background: "transparent", minHeight: "auto" }}
        >
          <section className="ag-content app-main-content ag-responsive-content">
            {title && (
              <div className="ag-breadcrumb" style={{ color: "var(--text-main, #5b6b62)" }}>
                IntelliFarm AI / {title}
              </div>
            )}
            {title && (
              <div className="ag-page-head" style={{ marginBottom: "20px" }}>
                <div>
                  {eyebrow && (
                    <p className="ag-eyebrow" style={{ color: "var(--sidebar-active-color, #2e7d32)", fontWeight: "bold" }}>
                      {eyebrow}
                    </p>
                  )}
                  <h1 style={{ color: "var(--body-color)" }}>{title}</h1>
                  {subtitle && (
                    <p className="ag-subtitle" style={{ opacity: 0.7, color: "var(--body-color)" }}>
                      {subtitle}
                    </p>
                  )}
                </div>
                {actions && <div className="ag-page-actions">{actions}</div>}
              </div>
            )}
            {children}
          </section>
          <Footer />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
