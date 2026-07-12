import { fetchWeatherBundle } from "../services/weatherService.js";

class WeatherTool {
  async execute(locationQuery) {
    if (!locationQuery) return null;
    try {
      // locationQuery could be coordinates or city name. E.g. "Hyderabad" or { lat: 17.38, lon: 78.48 }
      let queryParams = {};
      if (typeof locationQuery === "object" && locationQuery.lat && locationQuery.lon) {
        queryParams = { lat: locationQuery.lat, lon: locationQuery.lon };
      } else if (typeof locationQuery === "string") {
        queryParams = { city: locationQuery };
      } else {
        return null;
      }

      const weatherData = await fetchWeatherBundle(queryParams);
      if (!weatherData) return null;

      const current = weatherData.weather || {};
      const main = current.main || {};
      const wind = current.wind || {};
      const weatherDesc = current.weather?.[0]?.description || "clear";

      return {
        location: current.name || locationQuery,
        temp: `${main.temp || 27}°C`,
        feelsLike: `${main.feels_like || 27}°C`,
        humidity: `${main.humidity || 60}%`,
        wind: `${wind.speed || 5} m/s`,
        condition: weatherDesc,
        rainfallProbability: `${weatherData.rainfallProbability * 12.5}%`, // derived approximation
        airQuality: weatherData.airQuality || "Moderate",
        advice: `Current temperature is ${main.temp || 27}°C with ${weatherDesc}. Humidity is ${main.humidity || 60}%.`
      };
    } catch (error) {
      console.error("WeatherTool execution failed:", error.message);
      return null;
    }
  }
}

export default new WeatherTool();
