import axios from "axios";

export const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? ""
    : (process.env.REACT_APP_SERVER_ENDPOINT || "http://localhost:5001");

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const readCookie = (name) => {
  const prefix = `${name}=`;
  return document.cookie.split(";").map((value) => value.trim()).find((value) => value.startsWith(prefix))?.slice(prefix.length);
};

let csrfRequest;
let refreshRequest;

export const getCsrfToken = () => readCookie("csrf_token");

export const ensureCsrfToken = async () => {
  if (getCsrfToken()) return getCsrfToken();
  if (!csrfRequest) {
    csrfRequest = axios.get(`${API_BASE_URL}/api/auth/csrf`, { withCredentials: true })
      .finally(() => { csrfRequest = undefined; });
  }
  await csrfRequest;
  return getCsrfToken();
};

api.interceptors.request.use(async (config) => {
  const unsafe = !["get", "head", "options"].includes((config.method || "get").toLowerCase());
  if (unsafe && !config.headers?.["X-CSRF-Token"]) {
    const token = await ensureCsrfToken();
    if (token) config.headers["X-CSRF-Token"] = token;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const authEndpoint = /\/api\/auth\/(login|register|oauth-login|refresh)/.test(request?.url || "");
    if (error.response?.status === 401 && !request?._retried && !authEndpoint) {
      request._retried = true;
      try {
        if (!refreshRequest) {
          refreshRequest = api.post("/api/auth/refresh", {}, { _skipRefresh: true })
            .finally(() => { refreshRequest = undefined; });
        }
        await refreshRequest;
        return api(request);
      } catch {
        window.dispatchEvent(new Event("intellifarm:session-expired"));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
