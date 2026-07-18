import { createSlice } from "@reduxjs/toolkit";

const authInitialState = { isLogin: false };

const authSlice = createSlice({
  name: "auth slice",
  initialState: authInitialState,
  reducers: {
    isLoginHandler(state, action) {
      state.isLogin = action.payload.isLogin;
    },
  },
});

export const authAction = authSlice.actions;

export default authSlice.reducer;
