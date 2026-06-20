import { useState } from "react";

import CropCard from "../components/CropCard";
import MainLayout from "../layouts/MainLayout";
import {
  getCropRecommendation,
  getFarmingTips,
} from "../services/chatApi";

const CropAdvisor = () => {
  const [form, setForm] = useState({
    soilType: "",
    location: "",
    season: "",
    farmSize: "",
  });
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");

  const changeHandler = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const askAdvisor = async (request, label) => {
    setLoading(label);
    setError("");
    try {
      const result = await request(form);
      setAnswer(result.data.recommendation);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to get AI advice right now.");
    } finally {
      setLoading("");
    }
  };

  return (
    <MainLayout
      eyebrow="AI Crop Planning"
      title="Crop Advisor"
      subtitle="Enter farm conditions and get AI-powered crop recommendations and practical farming tips."
    >
      <div className="ag-form ag-form--grid ag-panel">
        <select name="soilType" value={form.soilType} onChange={changeHandler}>
          <option value="">Select soil type</option>
          <option>Alluvial</option>
          <option>Black cotton</option>
          <option>Red sandy</option>
          <option>Loamy</option>
          <option>Clay</option>
        </select>
        <select name="season" value={form.season} onChange={changeHandler}>
          <option value="">Select season</option>
          <option>Kharif</option>
          <option>Rabi</option>
          <option>Zaid</option>
          <option>Summer</option>
          <option>Monsoon</option>
        </select>
        <input name="location" value={form.location} onChange={changeHandler} placeholder="Location" />
        <input name="farmSize" value={form.farmSize} onChange={changeHandler} placeholder="Farm size, e.g. 2 acres" />
        <button type="button" onClick={() => askAdvisor(getCropRecommendation, "recommend")}>
          {loading === "recommend" ? "Recommending..." : "Recommend Crop"}
        </button>
        <button type="button" onClick={() => askAdvisor(getFarmingTips, "tips")}>
          {loading === "tips" ? "Preparing..." : "Farming Tips"}
        </button>
      </div>
      {error && <p className="ag-error">{error}</p>}
      {answer && <CropCard title="IntelliFarm Advice" description={answer} />}
    </MainLayout>
  );
};

export default CropAdvisor;
