import styles from "./NewChat.module.css";
import PromptSection from "./PromptSection/PromptSection";
import { useSelector, useDispatch } from "react-redux";
import { uiAction } from "../../store/ui-gemini";

const NewChat = () => {
  const dispatch = useDispatch();
  const isSideBarLong = useSelector((state) => state.ui.isSidebarLong);

  const sideBarCloseHandler = () => {
    if (isSideBarLong === true) {
      dispatch(uiAction.toggleSideBar());
    }
  };
  return (
    <div className={styles["newchat-main"]} onClick={sideBarCloseHandler}>
      <div className={styles["text-section"]}>
        <h1>Welcome to IntelliFarm AI</h1>
        <h2>Smart Farming Assistance for Modern Agriculture</h2>
      </div>
      <PromptSection />
    </div>
  );
};

export default NewChat;
