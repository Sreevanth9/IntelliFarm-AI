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
  assistant: "/spryzen-ai",
  copilot: "/spryzen-ai",
  spryzenAi: "/spryzen-ai",
  settings: "/settings",
};

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
    title: "Spryzen AI",
    description: "Conversational help for specific farming questions across crops and soil.",
    route: ROUTES.copilot,
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
