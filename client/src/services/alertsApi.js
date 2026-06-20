import api from "./api";

export const fetchAlerts = () => api.get("/api/alerts");
export const fetchUnreadCount = () => api.get("/api/alerts/unread-count");
export const markAlertsRead = (payload) => api.post("/api/alerts/read", payload);
export const markAllAlertsRead = () => api.post("/api/alerts/read-all");
