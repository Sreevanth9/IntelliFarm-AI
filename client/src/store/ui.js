import { createSlice } from "@reduxjs/toolkit";

const uiInitialState = {
  isDark: true,
  isSidebarLong: false,
  isSettingsShow: false,
  isUserDetailsShow: false,
};

const uiSlice = createSlice({
  name: "uiSlice",
  initialState: uiInitialState,
  reducers: {
    toggleSideBar(state) {
      state.isSidebarLong = !state.isSidebarLong;
    },
    toggleTheme(state) {
      state.isDark = !state.isDark;
      const theme = state.isDark ? "dark" : "light";
      localStorage.setItem("theme", theme);
    },
    toggleSettings(state) {
      state.isSettingsShow = !state.isSettingsShow;
    },
    toggleUserDetailsShow(state) {
      state.isUserDetailsShow = !state.isUserDetailsShow;
    },
  },
});

export const uiAction = uiSlice.actions;
export default uiSlice.reducer;
