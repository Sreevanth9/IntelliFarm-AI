import api from "./api";

export const addFarm = (farmData: {
  name: string;
  location?: string;
  crop: string;
  soilType: string;
  area: string;
  sowingDate: string;
}) => api.post("/api/farms", farmData);

export const fetchFarms = () => api.get("/api/farms");

export const deleteFarm = (id: string) => api.delete(`/api/farms/${id}`);
