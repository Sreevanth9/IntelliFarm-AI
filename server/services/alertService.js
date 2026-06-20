import { supabase } from "../config/supabase.js";
import { fetchWeatherBundle } from "./weatherService.js";

const createAlertIfUnique = async (userId, alert) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const { data: existing, error } = await supabase
    .from("alerts")
    .select("id")
    .eq("user_id", userId)
    .eq("title", alert.title)
    .gt("created_at", oneDayAgo)
    .maybeSingle();

  if (error) {
    console.error("Error checking alert uniqueness:", error.message);
    return;
  }

  if (!existing) {
    const { error: insertError } = await supabase
      .from("alerts")
      .insert({
        user_id: userId,
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        category: alert.category,
        is_read: false
      });
    if (insertError) {
      console.error("Error inserting alert:", insertError.message);
    }
  }
};

export const syncUserAlerts = async (userId, userLocation) => {
  try {
    // 1. Weather-based alerts
    const city = userLocation ? userLocation.split(",")[0].trim() : "Hyderabad";
    try {
      const weatherBundle = await fetchWeatherBundle({ city });
      if (weatherBundle) {
        const temp = weatherBundle.weather?.main?.temp;
        const humidity = weatherBundle.weather?.main?.humidity;
        const forecast = weatherBundle.forecast;
        
        // Rain probability check
        const rainHours = forecast?.list?.slice(0, 8).filter((item) =>
          item.weather?.[0]?.main?.toLowerCase().includes("rain")
        ).length || 0;

        if (rainHours > 2) {
          await createAlertIfUnique(userId, {
            title: "Heavy Rainfall Expected",
            message: "Weather forecasts indicate high rain probability. Consider delaying pesticide spraying and check field drainage bunds.",
            severity: "medium",
            category: "weather"
          });
        }

        // Fungal/Humidity check
        if (temp > 30 && humidity > 70) {
          await createAlertIfUnique(userId, {
            title: "High Disease Risk Alert",
            message: `Temperature is ${temp}°C and Humidity is ${humidity}%. Conditions are highly favorable for fungal infections. Inspect leaf foliage regularly.`,
            severity: "high",
            category: "disease"
          });
        }
      }
    } catch (weatherErr) {
      console.warn("Failed to fetch weather for alert sync:", weatherErr.message);
    }

    // 2. Farm-based alerts
    const { data: farms, error: farmsError } = await supabase
      .from("farms")
      .select("*")
      .eq("user_id", userId);

    if (!farmsError && farms && farms.length > 0) {
      for (const farm of farms) {
        const sowing = new Date(farm.sowing_date);
        const diffDays = Math.floor((Date.now() - sowing.getTime()) / (1000 * 60 * 60 * 24));

        // Seedling phase
        if (diffDays <= 7) {
          await createAlertIfUnique(userId, {
            title: `Seedling Care: ${farm.farm_name}`,
            message: `Your ${farm.crop} was sown ${diffDays} days ago. Ensure soil stays consistently moist, but avoid flooding or waterlogging.`,
            severity: "low",
            category: "crop"
          });
        }

        // Fertilizer reminder (approx 25-35 days)
        if (diffDays >= 25 && diffDays <= 35) {
          await createAlertIfUnique(userId, {
            title: `NPK Application Reminder: ${farm.farm_name}`,
            message: `Your ${farm.crop} is in its active vegetative stage (sown ${diffDays} days ago). Consider applying top-dressing fertilizer.`,
            severity: "medium",
            category: "crop"
          });
        }

        // Crop specific advice
        if (farm.crop.toLowerCase() === "paddy" || farm.crop.toLowerCase() === "rice") {
          await createAlertIfUnique(userId, {
            title: "Water Management: Paddy",
            message: "Maintain shallow standing water (2-5cm) in your paddy fields during active tillering to boost yield potential.",
            severity: "medium",
            category: "crop"
          });
        }
        
        if (farm.crop.toLowerCase() === "tomato") {
          await createAlertIfUnique(userId, {
            title: "Early Blight Prevention: Tomato",
            message: "Prune lower leaves of tomato plants to prevent soil-borne pathogens from splashing onto lower foliage.",
            severity: "medium",
            category: "crop"
          });
        }
      }
    }
  } catch (error) {
    console.error("Alert sync process failed:", error.message);
  }
};
