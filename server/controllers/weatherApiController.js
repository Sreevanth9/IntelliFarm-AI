import {
  fetchForecastData,
  fetchWeatherBundle,
  fetchWeatherData,
} from "../services/weatherService.js";
import Groq from "groq-sdk";

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

export const getWeatherAdvisory = async (req, res, next) => {
  try {
    const { temp, humidity, windSpeed, rainSlotsCount, cityName, cropName } = req.query;

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.warn("GROQ_API_KEY is missing on the server, using rule-based fallback");
      return res.status(200).json({ 
        success: true, 
        advisory: "Spryzen AI Advisory: Dry forecast signals suitable windows for spraying and field weeding. Ensure soil aeration."
      });
    }

    const groq = new Groq({ apiKey: groqApiKey });
    const prompt = `You are Spryzen AI, a senior agronomist. 
Generate a short agricultural weather farm advisory for a farmer in ${cityName || "this city"}.
Current parameters:
- Temperature: ${temp}°C
- Humidity: ${humidity}%
- Wind Speed: ${windSpeed} m/s
- Rain signals: ${rainSlotsCount > 0 ? "Rain expected in upcoming forecast" : "Dry forecast"}
- Crop profile: ${cropName || "General Crop"}

Rules:
- Keep the response short (under 4 sentences) and highly actionable.
- Focus on pesticide spraying suitability, irrigation recommendations, disease risk, and soil conservation advice.
- Speak directly and supportively as Spryzen AI. Do not use markdown wrappers.`;

    const response = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are Spryzen AI, a helpful agronomist weather assistant."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile"
    });

    const advisory = response.choices[0].message.content.trim();
    res.status(200).json({ success: true, advisory });
  } catch (error) {
    console.error("Spryzen Weather Advisory failed:", error.message);
    next(error);
  }
};
