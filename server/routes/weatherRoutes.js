import express from "express";

import {
  getForecast,
  getWeather,
  getWeatherBundle,
  getWeatherAdvisory,
} from "../controllers/weatherApiController.js";
import { weatherLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();
router.use(weatherLimiter);

router.get("/advisory", getWeatherAdvisory);
router.get("/", getWeatherBundle);
router.get("/current", getWeather);
router.get("/forecast", getForecast);

router.get("/weather", getWeather);
export default router;
