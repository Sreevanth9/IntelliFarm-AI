import styles from "./SettingSection.module.css";
import ToggleButton from "./ToggleButton";
import { themeIcon } from "../../assets";
import { useSelector, useDispatch } from "react-redux";
import { uiAction } from "../../store/ui";

const SettingSection = () => {
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.ui.isDark);
  const isSettingsShow = useSelector((state) => state.ui.isSettingsShow);

  const themeHandler = () => {
    dispatch(uiAction.toggleTheme());
  };

  const icon = themeIcon();
  const settingShow = isSettingsShow ? "settngs-show" : "settings-hide";
  const getLocalTheme = localStorage.getItem("theme");
  const theme = getLocalTheme || "dark";

  return (
    <div className={`${styles["setting-main"]} ${styles[settingShow]}`}>
      <div className={styles["title"]}>
        <h4>Settings</h4>
      </div>
      <div className={styles["public-link"]}>
        <img src={icon.linkIcon} alt="link icon"></img>
        <p>Your public links</p>
      </div>
      <div className={styles["theme"]}>
        <img src={icon.moonIcon} alt="moon icon"></img>
        <p>Dark theme</p>
        <ToggleButton theme={theme} onClick={themeHandler} mode={themeMode} />
      </div>
    </div>
  );
};

export default SettingSection;
