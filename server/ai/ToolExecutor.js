import weatherTool from "./WeatherTool.js";
import diseaseTool from "./DiseaseTool.js";
import marketTool from "./MarketTool.js";

class ToolExecutor {
  async executeAll(userMessage, userProfile = null) {
    const q = (userMessage || "").toLowerCase();
    const location = userProfile?.location || "Hyderabad";
    const crop = userProfile?.crops_interested?.[0] || "Paddy";

    let weatherData = null;
    let diseaseData = null;
    let marketData = null;

    // 1. Detect Weather Intent
    const weatherKeywords = ["weather", "rain", "temperature", "forecast", "climate", "temp", "shower", "cloud", "monsoon"];
    if (weatherKeywords.some(keyword => q.includes(keyword))) {
      weatherData = await weatherTool.execute(location);
    }

    // 2. Detect Disease Intent
    const diseaseKeywords = ["disease", "pest", "spot", "blight", "fungal", "insect", "rot", "mold", "leaf", "burn", "rust"];
    if (diseaseKeywords.some(keyword => q.includes(keyword))) {
      // Get recent reports for context
      const reports = userProfile?.id ? await diseaseTool.getRecentReports(userProfile.id) : [];
      // Also get matching disease guides if mentioned in text
      const guide = diseaseTool.getDiseaseGuide(q);
      
      diseaseData = {
        recentReports: reports,
        currentGuide: guide
      };
    }

    // 3. Detect Market Intent
    const marketKeywords = ["market", "price", "mandi", "sell", "cost", "rate", "value", "profit", "price index"];
    if (marketKeywords.some(keyword => q.includes(keyword))) {
      // Identify crop mentioned or use fallback
      let targetCrop = crop;
      if (q.includes("tomato")) targetCrop = "Tomato";
      else if (q.includes("onion")) targetCrop = "Onion";
      else if (q.includes("cotton")) targetCrop = "Cotton";
      else if (q.includes("chili") || q.includes("chilli")) targetCrop = "Chili";
      else if (q.includes("paddy") || q.includes("rice")) targetCrop = "Paddy";
      
      marketData = await marketTool.execute(targetCrop, location);
    }

    return {
      weather: weatherData,
      disease: diseaseData,
      market: marketData
    };
  }
}

export default new ToolExecutor();
