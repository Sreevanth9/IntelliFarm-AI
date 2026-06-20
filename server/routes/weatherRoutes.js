import express from "express";

import {
  getForecast,
  getWeather,
  getWeatherBundle,
} from "../controllers/weatherApiController.js";

const router = express.Router();

router.get("/", getWeatherBundle);
router.get("/current", getWeather);
router.get("/forecast", getForecast);

router.get("/weather", getWeather);
export default router;
