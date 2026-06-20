import {
  fetchForecastData,
  fetchWeatherBundle,
  fetchWeatherData,
} from "../services/weatherService.js";

const sendWeatherResponse = async (handler, req, res, next) => {
  try {
    const data = await handler(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    if (error.response) {
      error.statusCode = error.response.status;
      error.message = error.response.data?.message || "Unable to fetch weather data";
      error.data = error.response.data;
    }
    next(error);
  }
};

export const getWeather = (req, res, next) => {
  sendWeatherResponse(fetchWeatherData, req, res, next);
};

export const getForecast = (req, res, next) => {
  sendWeatherResponse(fetchForecastData, req, res, next);
};

export const getWeatherBundle = (req, res, next) => {
  sendWeatherResponse(fetchWeatherBundle, req, res, next);
};
