import api from "./api";

export const registerUser = (payload) => api.post("/api/auth/register", payload);
export const loginUser = (payload) => api.post("/api/auth/login", payload);
export const fetchCurrentUser = () => api.get("/api/auth/me");
export const logoutUser = () => api.post("/api/auth/logout");
export const oauthLoginUser = (payload) => api.post("/api/auth/oauth-login", payload);
export const changePasswordUser = (payload) => api.post("/api/auth/change-password", payload);
