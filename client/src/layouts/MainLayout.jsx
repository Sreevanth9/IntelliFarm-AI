import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { NavLink } from "react-router-dom";
import { SIDEBAR_ITEMS } from "../utils/constants";

const MainLayout = ({ children, eyebrow, title, subtitle, actions = null }) => {
  return (
    <div className="ag-layout-container">
      <Sidebar />
      <div className="ag-main-container">
        <Navbar />
        <main className="ag-page" style={{ flex: 1, display: "flex", flexDirection: "column", background: "transparent", minHeight: "auto" }}>
          <section className="ag-content app-main-content" style={{ flex: 1, width: "100%", maxWidth: "1280px", margin: "0 auto", padding: "24px 24px 60px 24px" }}>
            <div className="ag-breadcrumb" style={{ color: "var(--text-main, #5b6b62)" }}>IntelliFarm AI / {title}</div>
            <div className="ag-page-head" style={{ marginBottom: "20px" }}>
              <div>
                {eyebrow && <p className="ag-eyebrow" style={{ color: "var(--sidebar-active-color, #2e7d32)", fontWeight: "bold" }}>{eyebrow}</p>}
                <h1 style={{ color: "var(--body-color)" }}>{title}</h1>
                {subtitle && <p className="ag-subtitle" style={{ opacity: 0.7, color: "var(--body-color)" }}>{subtitle}</p>}
              </div>
              {actions && <div className="ag-page-actions">{actions}</div>}
            </div>
            {children}
          </section>
          <Footer />
        </main>
      </div>
      
      <div className="mobile-bottom-nav">
        {SIDEBAR_ITEMS.map(([label, href, icon]) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) =>
              isActive ? "mobile-bottom-nav-item active" : "mobile-bottom-nav-item"
            }
          >
            <span>{icon}</span>
            <span style={{ fontSize: "9px" }}>{label.split(" ")[0]}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default MainLayout;
