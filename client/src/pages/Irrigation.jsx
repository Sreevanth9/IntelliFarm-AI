import MainLayout from "../layouts/MainLayout";

const schedules = [
  { crop: "Paddy", need: "Maintain shallow water during vegetative stage", method: "Alternate wetting and drying" },
  { crop: "Tomato", need: "Consistent moisture, avoid waterlogging", method: "Drip irrigation" },
  { crop: "Cotton", need: "Deep irrigation at longer intervals", method: "Furrow or drip" },
  { crop: "Maize", need: "Critical water at tasseling and grain filling", method: "Sprinkler or furrow" },
];

const Irrigation = () => {
  return (
    <MainLayout
      eyebrow="Water Management"
      title="Irrigation Assistant"
      subtitle="Plan crop-wise irrigation schedules and weather-aware water-saving actions."
    >
      <div className="ag-grid">
        {schedules.map((item) => (
          <article className="ag-card ag-card--stack" key={item.crop}>
            <div>
              <p>{item.crop}</p>
              <h3>{item.method}</h3>
              <span>{item.need}</span>
            </div>
          </article>
        ))}
      </div>
      <section className="ag-panel">
        <h2>Water-Saving Tips</h2>
        <div className="ag-alert-list">
          <article className="ag-alert">Irrigate early morning or evening to reduce evaporation.</article>
          <article className="ag-alert">Use mulch around vegetable crops to retain soil moisture.</article>
          <article className="ag-alert">Skip irrigation when rain probability is high within 24 hours.</article>
        </div>
      </section>
    </MainLayout>
  );
};

export default Irrigation;
