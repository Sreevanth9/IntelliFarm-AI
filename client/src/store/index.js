import { configureStore } from "@reduxjs/toolkit";

import uiReducer from "./ui";
import userReducer from "./user";
import authReducer from "./auth";

const store = configureStore({
  reducer: {
    ui: uiReducer,
    user: userReducer,
    auth: authReducer,
  },
});

export default store;
