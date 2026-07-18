import api from "./api";

export interface FarmPayload {
  name: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  crop: string;
  cropVariety?: string;
  soilType: string;
  area: string;
  sowingDate: string;
  expectedHarvest?: string;
  irrigationMethod?: string;
  notes?: string;
}

export const addFarm = (farmData: FarmPayload) => api.post("/api/farms", farmData);

export const fetchFarms = () => api.get("/api/farms");

export const fetchFarm = (id: string) => api.get(`/api/farms/${id}`);

export const updateFarm = (id: string, farmData: Partial<FarmPayload>) =>
  api.put(`/api/farms/${id}`, farmData);

export const deleteFarm = (id: string) => api.delete(`/api/farms/${id}`);
