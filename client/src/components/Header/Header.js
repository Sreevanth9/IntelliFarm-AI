import styles from "./Header.module.css";
import { useDispatch, useSelector } from "react-redux";
import { uiAction } from "../../store/ui-assistant";
import { themeIcon } from "../../assets";
import { commonIcon } from "../../assets";
import { useNavigate } from "react-router-dom";
import { chatAction } from "../../store/chat";
import { continueWithGoogleOauth } from "../../utils/getGoogleOauthUrl";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isNewChat = useSelector((state) => state.chat.newChat);
  const isUserDetails = useSelector((state) => state.ui.isUserDetailsShow);
  const isLogin = useSelector((state) => state.auth.isLogin);
  const userDetails = useSelector((state) => state.user.user);

  const toggleSideBarHandler = () => {
    dispatch(uiAction.toggleSideBar());
  };

  const icon = themeIcon();

  const newChatHandler = () => {
    dispatch(chatAction.replaceChat({ chats: [] }));
    dispatch(chatAction.newChatHandler());
    dispatch(chatAction.chatHistoryIdHandler({ chatHistoryId: "" }));
    navigate("/assistant");
  };

  const userDetailsOpen = () => {
    dispatch(uiAction.toggleUserDetailsShow());
  };

  const loginHandler = () => {
    window.open(continueWithGoogleOauth(), "_self");
  };

  return (
    <div className={styles["header-main"]}>
      <div className={styles["left-section"]}>
        <div className={styles["menu-icon"]} onClick={toggleSideBarHandler}>
          <img src={icon.menuIcon} alt="menu icon"></img>
        </div>
        <div className={styles["name"]}>
          <p>IntelliFarm AI</p>
        </div>
      </div>
      <div className={styles["right-section"]}>
        {isNewChat ? (
          <div
            onClick={newChatHandler}
            className={`${styles["plus-icon"]} ${styles["new-plus-icon"]}`}
          >
            <img src={icon.plusIcon} alt="plus icon"></img>
          </div>
        ) : null}

        {isLogin ? (
          <div
            onClick={userDetailsOpen}
            className={`${styles["user"]} ${
              isUserDetails ? styles["clicked-user"] : ""
            }`}
          >
            {userDetails?.profileImg.length > 0 ? (
              <img src={userDetails?.profileImg} alt=""></img>
            ) : (
              ""
            )}
          </div>
        ) : (
          <div className={styles["login"]} onClick={loginHandler}>
            <img src={commonIcon.googleLogo} alt="google logo"></img>
            <p>Sign in</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
