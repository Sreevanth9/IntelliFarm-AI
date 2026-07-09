import styles from "./PromptSection.module.css";
import { useDispatch } from "react-redux";
import { chatAction } from "../../../store/chat";
import { Leaf, CloudSun, TrendingUp, Sprout } from "lucide-react";

const PromptSection = () => {
  const dispatch = useDispatch();

  const prompts = [
    {
      sort: "Diagnose my crop",
      long: "Please diagnose my crop health and identify any visible diseases or deficiencies.",
      icon: Leaf,
      color: "#2E7D32"
    },
    {
      sort: "Will it rain tomorrow?",
      long: "What is the weather forecast for tomorrow and how will it affect my farming operations?",
      icon: CloudSun,
      color: "#0288D1"
    },
    {
      sort: "Best market price for paddy?",
      long: "What is the current market price for paddy and where is the best market to sell my harvest?",
      icon: TrendingUp,
      color: "#F57C00"
    },
    {
      sort: "Recommend fertilizer",
      long: "Recommend the best fertilizer plan for my crop based on typical soil nutrient needs.",
      icon: Sprout,
      color: "#7B1FA2"
    }
  ];

  const promptOnClick = (mainText) => {
    dispatch(chatAction.suggestPromptHandler({ prompt: mainText }));
  };

  return (
    <div className={styles["prompt-main"]}>
      {prompts.map((p, index) => {
        const Icon = p.icon;
        return (
          <div
            className={styles["prompt"]}
            key={index}
            onClick={() => promptOnClick(p.long)}
          >
            <div className={styles["icon-wrapper"]} style={{ backgroundColor: p.color + '15', color: p.color }}>
              <Icon size={18} />
            </div>
            <p className={styles["prompt-text"]}>{p.sort}</p>
          </div>
        );
      })}
    </div>
  );
};

export default PromptSection;
