import React, { useEffect, useState } from "react";
import styles from "./Sidebar.module.css";
import { themeIcon } from "../../assets";
import { commonIcon } from "../../assets";
import { useSelector, useDispatch } from "react-redux";
import { uiAction } from "../../store/ui";
import { Link, useNavigate } from "react-router-dom";
import { userUpdateLocation } from "../../store/user-action";

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isSidebarLong = useSelector((state: any) => state.ui.isSidebarLong);
  const location = useSelector((state: any) => state.user.location);
  const platformLinks = [
    ["Home", "/"],
    ["Dashboard", "/dashboard"],
    ["My Farms", "/farms"],
    ["IntelliFarm Copilot", "/copilot"],
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

  const settingsHandler = (e: any) => {
    dispatch(uiAction.toggleSettings());
    if (e.view.innerWidth <= 960) {
      dispatch(uiAction.toggleSideBar());
    }
  };

  const icon = themeIcon();
  const sideBarWidthClass = isSidebarLong ? "side-bar-long" : "side-bar-sort";

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

      {isSidebarLong && (
        <div className={styles["recent-chat-section"]}>
          <nav className={styles["platform-nav"]}>
            {platformLinks.map(([label, path]) => (
              <Link key={path} to={path}>
                <div className={styles["platform-nav-link"]}>
                  <img src={commonIcon.assistantIcon} alt=""></img>
                  <p>{label}</p>
                </div>
              </Link>
            ))}
          </nav>
        </div>
      )}

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
            <img src={commonIcon.advancedAssistantIcon} alt="assistant-logo"></img>
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
