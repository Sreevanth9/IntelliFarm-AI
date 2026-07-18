import api from "./api";

export const detectDisease = (image, lat, lon) => api.post("/api/crops/disease-detect", { image, lat, lon });
export const fetchDiseaseReports = () => api.get("/api/crops/disease-reports");
