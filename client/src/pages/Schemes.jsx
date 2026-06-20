import { useMemo, useState } from "react";

import EmptyState from "../components/EmptyState/EmptyState";
import MainLayout from "../layouts/MainLayout";
import schemes from "../data/schemes.json";

const Schemes = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(schemes.map((scheme) => scheme.category))];

  const filteredSchemes = useMemo(() => {
    const query = search.toLowerCase();
    return schemes.filter((scheme) => {
      const matchesSearch =
        scheme.name.toLowerCase().includes(query) ||
        scheme.detail.toLowerCase().includes(query) ||
        scheme.state.toLowerCase().includes(query);
      const matchesCategory = category === "All" || scheme.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <MainLayout
      eyebrow="Farmer Benefits"
      title="Government Schemes"
      subtitle="View major agriculture schemes, eligibility, and official application links."
    >
      <form className="ag-form ag-form--grid">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search scheme, state, or benefit" />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </form>
      {filteredSchemes.length === 0 ? (
        <EmptyState title="No schemes found" message="Try a different category, state, or keyword." />
      ) : (
        <div className="ag-grid">
          {filteredSchemes.map((scheme) => (
            <article className="ag-card ag-card--stack" key={scheme.name}>
              <div>
                <p>{scheme.category} | {scheme.state}</p>
                <h3>{scheme.name}</h3>
                <span>{scheme.detail}</span>
                <p className="ag-note"><strong>Eligibility:</strong> {scheme.eligibility}</p>
                <a className="ag-text-link" href={scheme.link} target="_blank" rel="noreferrer">Apply / Learn More</a>
              </div>
            </article>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default Schemes;
