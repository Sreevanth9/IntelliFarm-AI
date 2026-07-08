import React, { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";
import { themeIcon } from "../../assets";
import { commonIcon } from "../../assets";
import { useSelector, useDispatch } from "react-redux";
import { uiAction } from "../../store/ui-gemini";
import { chatAction } from "../../store/chat";
import { Link, useNavigate } from "react-router-dom";
import { userUpdateLocation } from "../../store/user-action";

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isSidebarLong = useSelector((state: any) => state.ui.isSidebarLong);
  const isNewChat = useSelector((state: any) => state.chat.newChat);
  const recentChat = useSelector((state: any) => state.chat.recentChat);
  const [isShowMore, setisShowMore] = useState(false);
  const [isActiveChat, setIsActiveChat] = useState("");
  const chatHistoryId = useSelector((state: any) => state.chat.chatHistoryId);
  const location = useSelector((state: any) => state.user.location);
  const platformLinks = [
    ["Home", "/"],
    ["Dashboard", "/dashboard"],
    ["My Farms", "/farms"],
    ["AI Assistant", "/assistant"],
    ["Weather", "/weather"],
    ["Fertilizer", "/fertilizer"],
    ["Schemes", "/schemes"],
    ["Disease Info", "/disease-info"],
    ["Disease Detection", "/disease-detection"],
    ["Profile", "/profile"],
  ];

  const sideBarWidthHandler = () => {
    dispatch(uiAction.toggleSideBar());
  };

  const showMoreHandler = () => {
    setisShowMore((pre) => !pre);
  };

  useEffect(() => {
    const id = chatHistoryId || "";
    setIsActiveChat(id);
  }, [chatHistoryId]);

  const settingsHandler = (e: any) => {
    dispatch(uiAction.toggleSettings());
    if (e.view.innerWidth <= 960) {
      dispatch(uiAction.toggleSideBar());
    }
  };

  const newChatHandler = () => {
    dispatch(chatAction.replaceChat({ chats: [] }));
    dispatch(chatAction.newChatHandler());
    dispatch(chatAction.chatHistoryIdHandler({ chatHistoryId: "" }));
    navigate("/assistant");
  };

  const icon = themeIcon();
  const sideBarWidthClass = isSidebarLong ? "side-bar-long" : "side-bar-sort";
  const showMoreArrowIcon = isShowMore ? icon.upArrowIcon : icon.expandIcon;

  console.log("sidebar");

  const updateLocationHandler = () => {
    const locationVal = localStorage.getItem("location");
    if (!locationVal) {
      dispatch(userUpdateLocation() as any);
    }
  };

  return (
    <div className={`${styles["sidebar-main"]} ${styles[sideBarWidthClass]}`}>
      <div className={styles["menu-icon"]} onClick={sideBarWidthHandler}>
        <img src={icon.menuIcon} alt="menu icon"></img>
      </div>

      <div className={styles["recent-chat-section"]}>
        {isNewChat ? (
          <div
            onClick={newChatHandler}
            className={`${styles["pluc-icon"]} ${styles["new-plus-icon"]}`}
          >
            <img src={icon.plusIcon} alt="plus icon"></img>
            {isSidebarLong && <p>New chat</p>}
          </div>
        ) : (
          <div className={`${styles["pluc-icon"]} ${styles["old-plus-icon"]}`}>
            <img src={icon.plusIcon} alt="plus icon"></img>
            {isSidebarLong && <p>New chat</p>}
          </div>
        )}
        {isSidebarLong && (
          <nav className={styles["platform-nav"]}>
            {platformLinks.map(([label, path]) => (
              <Link key={path} to={path}>
                <div className={styles["platform-nav-link"]}>
                  <img src={commonIcon.geminiIcon} alt=""></img>
                  <p>{label}</p>
                </div>
              </Link>
            ))}
          </nav>
        )}
        {isSidebarLong && (
          <div className={styles["recent-chat-main"]}>
            <p>Recent</p>

            {(recentChat || []).slice(0, 5).map((chat: any) => (
              <Link to={`/assistant/app/${chat._id}`} key={chat._id}>
                <div
                  className={`${styles["recent-chat"]} ${
                    isActiveChat === chat._id
                      ? styles["active-recent-chat"]
                      : ""
                  }`}
                  onClick={() => {
                    setIsActiveChat(chat._id);
                  }}
                >
                  <img src={icon.messageIcon} alt="message"></img>
                  <p>{chat.title.slice(0, 20)}</p>
                </div>
              </Link>
            ))}
            {recentChat && recentChat.length > 5 && (
              <div className={styles["show-more"]} onClick={showMoreHandler}>
                <img src={showMoreArrowIcon} alt="drop down"></img>
                <p>Show more</p>
              </div>
            )}

            {isShowMore &&
              recentChat &&
              recentChat.slice(5, recentChat.length).map((chat: any) => (
                <Link to={`/assistant/app/${chat._id}`} key={chat._id}>
                  <div
                    className={`${styles["recent-chat"]} ${
                      isActiveChat === chat._id
                        ? styles["active-recent-chat"]
                        : ""
                    }`}
                    onClick={() => {
                      setIsActiveChat(chat._id);
                    }}
                    key={chat._id}
                  >
                    <img src={icon.messageIcon} alt="message"></img>
                    <p>{chat.title.slice(0, 20)}</p>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>

      <div className={styles["settings-section"]}>
        <div className={styles["help"]}>
          <img src={icon.helpIcon} alt="help icon"></img>
          {isSidebarLong && <p>Help</p>}
        </div>
        <div className={styles["activity"]}>
          <img src={icon.activityIcon} alt="activity icon"></img>
          {isSidebarLong && <p>Activity</p>}
        </div>
        <div className={styles["settings"]} onClick={settingsHandler}>
          <img src={icon.settingsIcon} alt="settings icon"></img>
          {isSidebarLong && <p>Settings</p>}
        </div>
        {isSidebarLong && (
          <div className={styles["upgrade-gimini"]}>
            <img src={commonIcon.advanceGeminiIcon} alt="gemini-logo"></img>
            <p>IntelliFarm Crop Expert</p>
          </div>
        )}
        <div className={styles["location"]} onClick={updateLocationHandler}>
          <div className={styles["dot"]}>
            <img src={icon.dotIcon} alt="dot icon"></img>
          </div>
          <p>
            <span className={styles["location-name"]}>{location}</span> From
            your IP address <span className={styles["span-dot"]}>.</span>
            <span> Update location</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
