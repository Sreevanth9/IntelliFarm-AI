import styles from "./NewChat.module.css";
import PromptSection from "./PromptSection/PromptSection";
import { useState, useEffect } from "react";

const capabilities = [
  "Diagnose plant diseases",
  "Recommend crop rotations",
  "Analyze weather schedules",
  "Track crop market prices",
  "Identify active subsidies"
];

const NewChat = () => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % capabilities.length);
        setFade(true);
      }, 300); // sync with css fade transition
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles["newchat-main"]}>
      <div className={styles["text-section"]}>
        <h1>Welcome to IntelliFarm AI</h1>
        
        {/* Rotating Capabilities Banner */}
        <div className={styles["rotating-banner"]}>
          <span className={styles["banner-static"]}>I can help you: </span>
          <span className={`${styles["banner-dynamic"]} ${fade ? styles["fade-in"] : styles["fade-out"]}`}>
            {capabilities[currentIdx]}
          </span>
        </div>      </div>

      <div className={styles["divider-section"]}>
        <span>Suggested Queries</span>
      </div>

      <PromptSection />
    </div>
  );
};

export default NewChat;
