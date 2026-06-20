import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import SectionTitle from "../components/SectionTitle";

const About = () => {
  return (
    <main className="ag-page">
      <Navbar />
      <section className="home-section">
        <p className="ag-eyebrow">About IntelliFarm</p>
        <h1>AI-supported agriculture workflows for modern farmers.</h1>
        <p>
          IntelliFarm AI brings weather, crop guidance, fertilizer planning, disease
          information, market awareness, schemes, and community support into one MERN platform.
        </p>
        <Link className="ag-primary-btn" to="/dashboard">Open Dashboard</Link>
      </section>
      <section className="home-section home-two-column">
        <div>
          <SectionTitle
            eyebrow="Mission"
            title="Make farm decision support simple, local, and accessible."
            subtitle="The mission is to give farmers structured tools for weather, crops, fertilizer, disease prevention, schemes, and market planning."
          />
        </div>
        <div className="ag-panel">
          <h2>Vision</h2>
          <p className="ag-note">
            A practical agriculture technology platform where AI supports real workflows instead
            of becoming the whole product.
          </p>
        </div>
      </section>
      <section className="home-section">
        <SectionTitle
          eyebrow="Objectives"
          title="Platform overview"
          subtitle="IntelliFarm AI is organized as a public website plus dashboard application, so it is easy to explain, extend, and demo."
        />
        <div className="ag-grid">
          {[
            ["Agriculture technology", "Use weather APIs, AI prompts, and static data layers to support farm decisions."],
            ["Farmer usability", "Keep workflows searchable, card-based, mobile-friendly, and action-oriented."],
            ["Scalable MERN base", "React modules consume Express APIs and MongoDB-backed auth/chat services."],
          ].map(([title, text]) => (
            <article className="ag-card ag-card--stack" key={title}>
              <h3>{title}</h3>
              <span>{text}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default About;
