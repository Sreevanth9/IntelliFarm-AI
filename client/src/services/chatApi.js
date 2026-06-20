import api from "./api";

export const getCropRecommendation = (payload) => {
  return api.post("/api/crops/crop-recommend", payload);
};

export const getFertilizerSuggestion = (payload) => {
  return api.post("/api/crops/fertilizer-suggest", payload);
};

export const getFarmingTips = (payload) => {
  return api.post("/api/crops/farming-tips", payload);
};
