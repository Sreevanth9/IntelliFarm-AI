import axios from "axios";
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

const requestWeather = async (endpoint, req, res, next) => {
  try {
    const params = buildWeatherParams(req.query);
    const { data } = await axios.get(`${OPENWEATHER_BASE_URL}/${endpoint}`, {
      params,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    if (error.response) {
      error.statusCode = error.response.status;
      error.message =
        error.response.data?.message || "Unable to fetch weather data";
      error.data = error.response.data;
    }
    next(error);
  }
};

export const getWeather = (req, res, next) => {
  requestWeather("weather", req, res, next);
};

export const getForecast = (req, res, next) => {
  requestWeather("forecast", req, res, next);
};
