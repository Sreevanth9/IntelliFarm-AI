import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import MainLayout from "../layouts/MainLayout";
import EmptyState from "../components/EmptyState/EmptyState";
import Loader from "../components/Loader";
import WeatherCard from "../components/WeatherCard";
import { fetchForecast, fetchWeather } from "../services/weatherApi";

const Weather = () => {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchWeatherForCity = async (cityName) => {
    if (!cityName) return;
    setLoading(true);
    setError("");
    try {
      const [weatherResult, forecastResult] = await Promise.all([
        fetchWeather({ city: cityName }),
        fetchForecast({ city: cityName }),
      ]);
      setWeather(weatherResult.data.data);
      setForecast(forecastResult.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load weather right now.");
      toast.error("Weather fetch failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const localLocation = localStorage.getItem("location");
    const initialCity = localLocation ? localLocation.split(",")[0].trim() : "Hyderabad";
    setCity(initialCity);
    fetchWeatherForCity(initialCity);
  }, []);

  const submitHandler = async (event) => {
    event.preventDefault();
    fetchWeatherForCity(city);
  };


  const rainSlots =
    forecast?.list
      ?.slice(0, 8)
      .filter((item) => item.weather?.[0]?.main?.toLowerCase().includes("rain")) || [];

  return (
    <MainLayout
      eyebrow="Weather Intelligence"
      title="Live Weather Guidance"
      subtitle="Search any city and view temperature, humidity, wind, conditions, and rain signals for farm planning."
    >
      <form className="ag-form ag-toolbar" onSubmit={submitHandler}>
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Enter city"
        />
        <button type="submit">{loading ? "Checking..." : "Check Weather"}</button>
      </form>
      {error && <p className="ag-error">{error}</p>}
      {loading && <Loader label="Fetching weather" />}
      {!loading && !weather && !error && (
        <EmptyState
          title="No weather data yet"
          message="Search a city to load live weather, forecast, and rain guidance."
        />
      )}
      {weather && (
        <>
          <div className="ag-grid ag-stats-grid">
            <WeatherCard title="Temperature" value={`${Math.round(weather.main.temp)} C`} helper="Live OpenWeather data" />
            <WeatherCard title="Feels Like" value={`${Math.round(weather.main.feels_like)} C`} helper="Field comfort estimate" />
            <WeatherCard title="Humidity" value={`${weather.main.humidity}%`} helper="Disease risk indicator" />
            <WeatherCard title="Wind Speed" value={`${weather.wind.speed} m/s`} helper="Spraying suitability" />
            <WeatherCard title="Rain Prediction" value={rainSlots.length ? "Possible" : "Low"} helper={`${rainSlots.length} rainy slots in forecast`} />
            <WeatherCard title="Condition" value={weather.weather[0].main} helper={weather.name} />
          </div>
          <section className="ag-panel">
            <h2>Weather-Aware Suggestion</h2>
            <p className="ag-note">
              {rainSlots.length
                ? "Delay pesticide spraying and prepare field drainage before the next rain window."
                : "Good window for fertilizer application, field inspection, and irrigation scheduling."}
            </p>
          </section>
        </>
      )}
    </MainLayout>
  );
};

export default Weather;
