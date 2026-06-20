import geminiIcon from "./intellifarm-icon.png";
import advanceGeminiIcon from "./crop-image.png";
import avatarIcon from "./intellifarm-icon.png";
import chatGeminiIcon from "./chatbot-logo.png";
import geminiLaoder from "./chatbot-logo.png";
import googleLogo from "./intellifarm-icon.png";
import ytIcon from "./weather-icon.png";
import flightIcon from "./weather-icon.png";
import mapIcon from "./intellifarm-icon.png";
import hotelIcon from "./crop-image.png";
import googleBigIcon from "./intellifarm-icon.png";

import { darkIcon } from "./darkIcon/darkIcon";
import { lightIcon } from "./lightIcon/lightIcon";

export const commonIcon = {
  geminiIcon,
  advanceGeminiIcon,
  avatarIcon,
  chatGeminiIcon,
  geminiLaoder,
  googleLogo,
  ytIcon,
  flightIcon,
  mapIcon,
  hotelIcon,
  googleBigIcon,
};

export const themeIcon = () => {
  const localTheme = localStorage.getItem("theme") || "dark";
  const icon = localTheme === "dark" ? darkIcon : lightIcon;

  return icon;
};

export const suggestPrompt = [
  {
    id: 1,
    sort: "Suggest crops for summer season",
    long: "Suggest suitable crops for the summer season for a small farm. Include water needs, soil preferences, and expected risks.",
    icon: "ideaIcon",
  },
  {
    id: 2,
    sort: "Best fertilizer for paddy farming",
    long: "What is the best fertilizer plan for paddy farming? Include organic alternatives, timing, and usage precautions.",
    icon: "ideaIcon",
  },
  {
    id: 3,
    sort: "How to prevent tomato leaf disease",
    long: "How can I prevent tomato leaf curl and fungal leaf diseases? Include symptoms, prevention, and treatment steps.",
    icon: "ideaIcon",
  },
  {
    id: 4,
    sort: "Weather impact on cotton farming",
    long: "Explain how rainfall, humidity, and temperature affect cotton farming and what actions I should take.",
    icon: "ideaIcon",
  },
  {
    id: 5,
    sort: "Best irrigation methods for water conservation",
    long: "Suggest water-saving irrigation methods for vegetable and cereal crops. Compare drip, sprinkler, and furrow irrigation.",
    icon: "navigateIcon",
  },
  {
    id: 6,
    sort: "Current market price strategy for rice",
    long: "How should a rice farmer decide when to sell based on market price trends, storage, and local demand?",
    icon: "ideaIcon",
  },
  {
    id: 7,
    sort: "Prepare a weekly pest monitoring plan",
    long: "Create a weekly pest monitoring plan for paddy, cotton, and tomato crops.",
    icon: "navigateIcon",
  },
  {
    id: 8,
    sort: "Recommend crops for black cotton soil",
    long: "Recommend crops for black cotton soil in monsoon season. Include fertilizer and irrigation tips.",
    icon: "ideaIcon",
  },
  {
    id: 9,
    sort: "Create an organic fertilizer plan",
    long: "Create an organic fertilizer plan for tomato farming using compost, neem cake, vermicompost, and biofertilizers.",
    icon: "writeIcon",
  },
  {
    id: 10,
    sort: "Plan irrigation after light rainfall",
    long: "My farm received light rainfall yesterday. How should I adjust irrigation for paddy, tomato, and cotton?",
    icon: "ideaIcon",
  },
  {
    id: 11,
    sort: "Find suitable government schemes",
    long: "Which government schemes may help a small farmer with crop insurance, income support, soil testing, and machinery subsidy?",
    icon: "writeIcon",
  },
  {
    id: 12,
    sort: "Diagnose yellow leaves in maize",
    long: "My maize crop has yellow leaves and slow growth. What are the possible causes and what should I do next?",
    icon: "writeIcon",
  },
];
