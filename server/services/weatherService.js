import axios from "axios";
import { supabase } from "../config/supabase.js";
import { OPENWEATHER_BASE_URL } from "../config/weather.js";

const buildWeatherParams = (query) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const { city, lat, lon, units = "metric" } = query;

  if (!apiKey) {
    const error = new Error("OpenWeather API key is missing");
    error.statusCode = 500;
    throw error;
  }

  if (lat && lon) {
    return { lat, lon, units, appid: apiKey };
  }

  if (city) {
    return { q: city, units, appid: apiKey };
  }

  const error = new Error("Please provide city or lat/lon");
  error.statusCode = 400;
  throw error;
};

const localCache = new Map();

const cacheRequest = async (key, requestHandler) => {
  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY && !process.env.SUPABASE_URL.includes("placeholder")) {
      const { data: cached, error: selectError } = await supabase
        .from("weather_caches")
        .select("data")
        .eq("key", key)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (!selectError && cached) {
        return cached.data;
      }
    }
  } catch (err) {
    console.warn("Supabase cache read failed, falling back to local memory:", err.message);
  }

  const inMemory = localCache.get(key);
  if (inMemory && inMemory.expiresAt > Date.now()) {
    return inMemory.data;
  }

  const data = await requestHandler();
  const expiresAtMs = Date.now() + 10 * 60 * 1000;
  localCache.set(key, { data, expiresAt: expiresAtMs });

  try {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY && !process.env.SUPABASE_URL.includes("placeholder")) {
      await supabase
        .from("weather_caches")
        .upsert({
          key,
          data,
          expires_at: new Date(expiresAtMs).toISOString(),
        });
    }
  } catch (err) {
    console.warn("Supabase cache write failed:", err.message);
  }

  return data;
};

export const fetchWeatherData = async (query) => {
  const params = buildWeatherParams(query);
  const cacheKey = `weather:${JSON.stringify(params)}`;

  return cacheRequest(cacheKey, async () => {
    const { data } = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, { params });
    return data;
  });
};

export const fetchForecastData = async (query) => {
  const params = buildWeatherParams(query);
  const cacheKey = `forecast:${JSON.stringify(params)}`;

  return cacheRequest(cacheKey, async () => {
    const { data } = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, { params });
    return data;
  });
};

export const fetchWeatherBundle = async (query) => {
  const [weather, forecast] = await Promise.all([
    fetchWeatherData(query),
    fetchForecastData(query),
  ]);

  return {
    weather,
    forecast,
    sunrise: weather.sys?.sunrise,
    sunset: weather.sys?.sunset,
    rainfallProbability:
      forecast.list?.slice(0, 8).filter((item) =>
        item.weather?.[0]?.main?.toLowerCase().includes("rain")
      ).length || 0,
    airQuality: "Moderate",
  };
};
