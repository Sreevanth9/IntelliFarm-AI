import api from "./api";

export const fetchSavedRecommendations = () =>
  api.get("/api/profile/recommendations");

export const saveRecommendation = (payload) =>
  api.post("/api/profile/recommendations", payload);

export const deleteSavedRecommendation = (id) =>
  api.delete(`/api/profile/recommendations/${id}`);
