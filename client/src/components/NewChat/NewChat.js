import styles from "./NewChat.module.css";
import PromptSection from "./PromptSection/PromptSection";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { chatAction } from "../../store/chat";
import { useAuth } from "../../context/AuthContext";

const NewChat = () => {
  const [subGreeting, setSubGreeting] = useState("");
  const dispatch = useDispatch();
  const { farmer } = useAuth();

  useEffect(() => {
    // Reset conversation state on landing page mount
    dispatch(chatAction.replaceChat({ chats: [] }));
    dispatch(chatAction.replacePreviousChat({ previousChat: [] }));
    dispatch(chatAction.chatHistoryIdHandler({ chatHistoryId: "" }));
    dispatch(chatAction.newChatHandler());
  }, [dispatch]);

  useEffect(() => {
    const subGreetings = [
      "🌾 Let's improve today's yield.",
      "🌦 Weather looks good today.",
      "🌱 Ready to help analyze your crops.",
      "🚜 What are we working on today?"
    ];
    const randomIndex = Math.floor(Math.random() * subGreetings.length);
    setSubGreeting(subGreetings[randomIndex]);
  }, []);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className={styles["newchat-main"]}>
      <div className={styles["welcome-container"]}>
        <h1 className={styles["welcome-title"]}>
          {getGreeting()}, {farmer?.name || "Sreevanth"} 👋
        </h1>
        <p className={styles["welcome-subtitle"]}>
          {subGreeting}
        </p>
      </div>

      <div className={styles["divider-section"]}>
        <span>Suggested Queries</span>
      </div>

      <PromptSection />
    </div>
  );
};

export default NewChat;
