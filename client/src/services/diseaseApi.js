import api from "./api";

export const detectDisease = (image, lat, lon, farmId) =>
  api.post("/api/crops/disease-detect", { image, lat, lon, farmId });
export const fetchDiseaseReports = () => api.get("/api/crops/disease-reports");
