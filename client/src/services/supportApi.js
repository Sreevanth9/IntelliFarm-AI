import api from "./api";

export const sendSupportMessageApi = (payload) => api.post("/api/support/send", payload);
