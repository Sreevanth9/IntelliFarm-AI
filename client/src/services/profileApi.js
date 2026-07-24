import api from "./api";

export const fetchProfile = () => api.get("/api/profile");
export const updateProfile = (payload) => api.put("/api/profile", payload);
export const deleteAccountApi = () => api.delete("/api/profile/account");

