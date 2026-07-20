import express from "express";

import {
  getForecast,
  getWeather,
  getWeatherBundle,
  getWeatherAdvisory,
} from "../controllers/weatherApiController.js";
import { weatherLimiter } from "../middleware/rateLimiters.js";

import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiters.js";

const router = express.Router();
router.use(weatherLimiter);

router.get("/advisory", requireAuth, aiLimiter, getWeatherAdvisory);
router.get("/", getWeatherBundle);
router.get("/current", getWeather);
router.get("/forecast", getForecast);

router.get("/weather", getWeather);
export default router;
