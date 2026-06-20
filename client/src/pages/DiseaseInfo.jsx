import { useMemo, useState } from "react";

import EmptyState from "../components/EmptyState/EmptyState";
import MainLayout from "../layouts/MainLayout";
import diseaseData from "../data/diseases.json";

const DiseaseInfo = () => {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [season, setSeason] = useState("All");

  const types = ["All", ...new Set(diseaseData.map((item) => item.type))];
  const seasons = ["All", ...new Set(diseaseData.map((item) => item.season))];

  const results = useMemo(() => {
    const query = search.toLowerCase();
    return diseaseData.filter((item) => {
      const matchesSearch =
        item.crop.toLowerCase().includes(query) ||
        item.disease.toLowerCase().includes(query);
      const matchesType = type === "All" || item.type === type;
      const matchesSeason = season === "All" || item.season === season;
      return matchesSearch && matchesType && matchesSeason;
    });
  }, [search, type, season]);

  return (
    <MainLayout
      eyebrow="Crop Protection"
      title="Disease Information"
      subtitle="Search crop diseases and view symptoms, prevention, treatment, and AI-ready guidance topics."
    >
      <form className="ag-form ag-form--grid">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search crop or disease" />
        <select value={type} onChange={(event) => setType(event.target.value)}>
          {types.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select value={season} onChange={(event) => setSeason(event.target.value)}>
          {seasons.map((item) => <option key={item}>{item}</option>)}
        </select>
      </form>
      {results.length === 0 ? (
        <EmptyState title="No disease records found" message="Try a different crop, season, or disease type." />
      ) : (
        <div className="ag-grid">
          {results.map((item) => (
            <article className="ag-card ag-card--stack" key={`${item.crop}-${item.disease}`}>
              <div>
                <p>{item.crop} | {item.type} | {item.season}</p>
                <h3>{item.disease}</h3>
                <span><strong>Symptoms:</strong> {item.symptoms}</span>
                <span><strong>Prevention:</strong> {item.prevention}</span>
                <span><strong>Treatment:</strong> {item.treatment}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </MainLayout>
  );
};

export default DiseaseInfo;
