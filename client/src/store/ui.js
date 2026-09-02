import { createSlice } from "@reduxjs/toolkit";

const uiInitialState = {
  isDark: true,
};

const uiSlice = createSlice({
  name: "uiSlice",
  initialState: uiInitialState,
  reducers: {
    toggleTheme(state) {
      state.isDark = !state.isDark;
      const theme = state.isDark ? "dark" : "light";
      localStorage.setItem("theme", theme);
    },
  },
});

export const uiAction = uiSlice.actions;
export default uiSlice.reducer;
