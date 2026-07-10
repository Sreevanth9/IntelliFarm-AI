import styles from "./PromptSection.module.css";
import { useDispatch } from "react-redux";
import { chatAction } from "../../../store/chat";

const PromptSection = () => {
  const dispatch = useDispatch();

  const getDynamicPrompts = () => {
    const hour = new Date().getHours();
    
    // Morning: 5 AM - 12 PM
    if (hour >= 5 && hour < 12) {
      return [
        { emoji: "🌦", label: "Will it rain today?", long: "What is the weather forecast for today and how will it affect my farming operations?" },
        { emoji: "💧", label: "Morning irrigation?", long: "Can you suggest an optimal morning irrigation schedule based on current soil and weather conditions?" },
        { emoji: "🌿", label: "Diagnose my crop", long: "Please diagnose my crop health and identify any visible diseases or deficiencies." },
        { emoji: "📈", label: "Paddy market price?", long: "What is the current market price for paddy and where is the best market to sell my harvest?" }
      ];
    }
    
    // Afternoon: 12 PM - 7 PM
    if (hour >= 12 && hour < 19) {
      return [
        { emoji: "☁️", label: "Tomorrow's forecast", long: "What is tomorrow's weather forecast and what action items should I plan for my farm?" },
        { emoji: "📊", label: "Market closing prices", long: "What are the latest market closing prices for main crops in my local mandi?" },
        { emoji: "🌿", label: "Diagnose my crop", long: "Please diagnose my crop health and identify any visible diseases or deficiencies." },
        { emoji: "🧪", label: "Recommend fertilizer", long: "Recommend the best fertilizer plan for my crop based on typical soil nutrient needs." }
      ];
    }
    
    // Night: 7 PM - 5 AM
    return [
      { emoji: "📋", label: "Plan tomorrow", long: "Help me plan tomorrow's farming activities, including optimal spraying and irrigation schedules." },
      { emoji: "🧪", label: "Recommend fertilizer", long: "Recommend the best fertilizer plan for my crops based on their current growth stage and soil requirements." },
      { emoji: "🛡", label: "Prevent pest attacks", long: "What are the best organic and chemical prevention methods for common pests during this season?" },
      { emoji: "🌿", label: "Diagnose my crop", long: "Please diagnose my crop health and identify any visible diseases or deficiencies." }
    ];
  };

  const prompts = getDynamicPrompts();

  const promptOnClick = (mainText) => {
    dispatch(chatAction.suggestPromptHandler({ prompt: mainText }));
  };

  return (
    <div className={styles["prompt-main"]}>
      {prompts.map((p, index) => (
        <button
          className={styles["prompt-chip"]}
          key={index}
          onClick={() => promptOnClick(p.long)}
          type="button"
        >
          <span className={styles["chip-emoji"]}>{p.emoji}</span>
          <span className={styles["chip-label"]}>{p.label}</span>
        </button>
      ))}
    </div>
  );
};

export default PromptSection;
