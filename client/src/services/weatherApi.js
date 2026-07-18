import api from "./api";

export const fetchWeather = (params) => {
  return api.get("/api/weather/current", { params });
};

export const fetchForecast = (params) => {
  return api.get("/api/weather/forecast", { params });
};

export const fetchWeatherBundle = (params) => {
  return api.get("/api/weather", { params });
};

export const fetchWeatherAdvisory = (params) => {
  return api.get("/api/weather/advisory", { params });
};
