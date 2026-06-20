import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import { ROUTES, SERVICE_CARDS } from "../utils/constants";

const Services = () => {
  return (
    <main className="ag-page">
      <Navbar />
      <section className="services-hero">
        <div>
          <p className="ag-eyebrow">Platform Coverage</p>
          <h2>Weather, crops, markets, schemes, and field guidance in one place.</h2>
          <p>
            Each module focuses on a real farmer task, so the product feels like an agriculture
            platform first and an intelligent agriculture guidance system second.
          </p>
          <Link className="ag-primary-btn" to={ROUTES.assistant}>Ask AI Assistant</Link>
        </div>
        <div className="services-hero__stats">
          <article>
            <strong>9</strong>
            <span>Core modules</span>
          </article>
          <article>
            <strong>24/7</strong>
            <span>Assistant access</span>
          </article>
          <article>
            <strong>1</strong>
            <span>Unified dashboard</span>
          </article>
        </div>
      </section>

      <section className="services-grid">
        {SERVICE_CARDS.map((service) => (
          <Link className="services-card" to={service.route} key={service.title}>
            <img src={service.icon} alt="" />
            <div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <span>Launch service</span>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
};

export default Services;
