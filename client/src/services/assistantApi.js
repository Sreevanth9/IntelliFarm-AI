import api from "./api";

export const sendAssistantMessage = (payload) =>
  api.post("/api/assistant/message", payload);

export const fetchAssistantHistory = () => api.get("/api/assistant/history");
