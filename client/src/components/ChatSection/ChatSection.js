import { Route, Routes } from "react-router-dom";
import Header from "../Header/Header";
import InputSection from "../InputSection/InputSection";
import NewChat from "../NewChat/NewChat";
import AdvanceGemini from "../Ui/AdvanceGmini";
import styles from "./ChatSection.module.css";
import { useSelector } from "react-redux";
import ScrollChat from "../NewChat/ScrollChat/ScrollChat";
import Loader from "../Ui/Loader";

const ChatSection = () => {
  const isLoader = useSelector((state) => state.chat.isLoader);
  return (
    <div className={styles["chat-section-main"]}>
      <Header />
      <AdvanceGemini />
      {isLoader && <Loader />}
      <Routes>
        <Route index element={<NewChat />}></Route>
        <Route path="app" element={<ScrollChat />}></Route>
        <Route path="app/:historyId" element={<ScrollChat />}></Route>
      </Routes>

      <InputSection />
      <div className={styles["warning-text"]}>
        <p>
          IntelliFarm AI can make mistakes. Verify critical farming, chemical,
          weather, and market decisions with local experts.
          <span>
            <a href="https://support.google.com/gemini?p=privacy_notice">
              Privacy notice
            </a>
          </span>
        </p>
      </div>
    </div>
  );
};

export default ChatSection;
