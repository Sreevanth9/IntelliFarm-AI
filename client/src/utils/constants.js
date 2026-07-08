import cropImage from "../assets/crop-image.png";
import weatherIcon from "../assets/weather-icon.png";

export const ROUTES = {
  home: "/",
  about: "/about",
  services: "/services",
  contact: "/contact",
  dashboard: "/dashboard",
  farms: "/farms",
  weather: "/weather",
  fertilizer: "/fertilizer",
  schemes: "/schemes",
  irrigation: "/irrigation",
  diseaseInfo: "/disease-info",
  diseaseDetection: "/disease-detection",
  profile: "/profile",
  assistant: "/assistant",
  settings: "/settings",
};

export const SIDEBAR_ITEMS = [
  ["Dashboard", ROUTES.dashboard, "📊"],
  ["My Farms", ROUTES.farms, "🚜"],
  ["Disease Detection", ROUTES.diseaseDetection, "🍃"],
  ["Profile", ROUTES.profile, "👤"],
  ["Settings", ROUTES.settings, "⚙️"],
];

export const SERVICE_CARDS = [
  {
    title: "Weather Intelligence",
    description: "Forecasts, rainfall alerts, humidity risk, and action windows for field work.",
    route: ROUTES.weather,
    icon: weatherIcon,
  },
  {
    title: "Fertilizer Guide",
    description: "Nutrient plans with organic options, timing, dosage reminders, and safety notes.",
    route: ROUTES.fertilizer,
    icon: cropImage,
  },
  {
    title: "AI Farming Assistant",
    description: "Conversational help for specific farming questions across crops and soil.",
    route: ROUTES.assistant,
    icon: cropImage,
  },
  {
    title: "Government Schemes",
    description: "Farmer schemes for insurance, soil health, equipment, and support programs.",
    route: ROUTES.schemes,
    icon: weatherIcon,
  },
  {
    title: "Irrigation Planning",
    description: "Water scheduling guidance for drip, sprinkler, furrow, and rainfall-adjusted plans.",
    route: ROUTES.irrigation,
    icon: weatherIcon,
  },
  {
    title: "Disease Detection",
    description: "Upload leaf pictures to get automated AI disease analysis and treatment suggestions.",
    route: ROUTES.diseaseDetection,
    icon: cropImage,
  },
];

export const BRAND_COLORS = {
  primary: "#2e7d32",
  deepGreen: "#183d24",
  leaf: "#4caf50",
  surface: "#f5f7ee",
};
