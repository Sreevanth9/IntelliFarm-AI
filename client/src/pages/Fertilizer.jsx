import { useState } from "react";

import CropCard from "../components/CropCard";
import MainLayout from "../layouts/MainLayout";
import { getFertilizerSuggestion } from "../services/chatApi";

const Fertilizer = () => {
  const [form, setForm] = useState({ crop: "", issue: "", soilType: "", stage: "" });
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const changeHandler = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await getFertilizerSuggestion(form);
      setAnswer(result.data.recommendation);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to get fertilizer guidance right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout
      eyebrow="Nutrient Management"
      title="Fertilizer Guide"
      subtitle="Get AI fertilizer suggestions, organic alternatives, and usage instructions for crop issues."
    >
      <form className="ag-form ag-form--grid ag-panel" onSubmit={submitHandler}>
        <select name="crop" value={form.crop} onChange={changeHandler}>
          <option value="">Select crop</option>
          <option>Paddy</option>
          <option>Wheat</option>
          <option>Tomato</option>
          <option>Cotton</option>
          <option>Maize</option>
        </select>
        <select name="issue" value={form.issue} onChange={changeHandler}>
          <option value="">Select issue</option>
          <option>Yellow leaves</option>
          <option>Poor flowering</option>
          <option>Slow growth</option>
          <option>Low yield</option>
          <option>Nutrient deficiency</option>
        </select>
        <input name="soilType" value={form.soilType} onChange={changeHandler} placeholder="Soil type" />
        <input name="stage" value={form.stage} onChange={changeHandler} placeholder="Crop stage" />
        <button type="submit">{loading ? "Preparing..." : "Get Fertilizer Plan"}</button>
      </form>
      {error && <p className="ag-error">{error}</p>}
      {answer ? (
        <CropCard title="Fertilizer Recommendation" description={answer} />
      ) : (
        <div className="ag-grid">
          <CropCard title="Organic Alternative" description="Use compost, farmyard manure, neem cake, and vermicompost where suitable." />
          <CropCard title="Usage Safety" description="Apply fertilizer near root zone, avoid wet leaves, and irrigate lightly after application." />
          <CropCard title="Demo Tip" description="For paddy, split nitrogen application generally performs better than single heavy dosing." />
        </div>
      )}
    </MainLayout>
  );
};

export default Fertilizer;
