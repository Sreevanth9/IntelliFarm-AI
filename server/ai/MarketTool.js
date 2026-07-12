class MarketTool {
  async execute(cropName, location = "Hyderabad") {
    const crop = (cropName || "Paddy").toLowerCase();
    
    let basePrice = "₹2,340 / Quintal";
    let change = "+1.8% (Stable)";
    let trend = "Upward";
    let market = "Central Mandi Yard";

    if (crop.includes("paddy") || crop.includes("rice")) {
      basePrice = "₹2,340 / Quintal";
      change = "+2.1% (Strong demand)";
      trend = "Upward";
      market = location.toLowerCase().includes("hyderabad") ? "Bowenpally Mandi, Hyderabad" : "Central Mandi Yard";
    } else if (crop.includes("tomato")) {
      basePrice = "₹1,800 / Crate (25kg)";
      change = "-5.4% (Excess supply arrivals)";
      trend = "Downward";
      market = location.toLowerCase().includes("hyderabad") ? "Bowenpally Mandi, Hyderabad" : "Local wholesale market";
    } else if (crop.includes("cotton")) {
      basePrice = "₹7,200 / Quintal";
      change = "+0.8% (Flat export index)";
      trend = "Stable";
      market = "Warangal Market Yard";
    } else if (crop.includes("onion")) {
      basePrice = "₹3,400 / Quintal";
      change = "+4.2% (Short supply arrivals)";
      trend = "Upward";
      market = "Kurnool Mandi Yard";
    } else if (crop.includes("chili") || crop.includes("chilli")) {
      basePrice = "₹18,500 / Quintal";
      change = "+3.5% (High export quality demand)";
      trend = "Upward";
      market = "Guntur Mandi, AP";
    }

    return {
      crop: cropName || "Paddy",
      price: basePrice,
      change,
      trend,
      market,
      location,
      asOfDate: new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
      recommendation: trend === "Upward" ? "Hold for 1-2 weeks if crop storage is dry; prices are expected to rise further." : "Sell crop arrivals directly to mitigate inventory storage losses."
    };
  }
}

export default new MarketTool();
