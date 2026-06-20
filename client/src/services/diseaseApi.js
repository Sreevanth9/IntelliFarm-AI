import api from "./api";

export const detectDisease = (image) => api.post("/api/crops/disease-detect", { image });
export const fetchDiseaseReports = () => api.get("/api/crops/disease-reports");
