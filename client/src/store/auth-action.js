import { authAction } from "./auth";
import { userAction } from "./user";

const SERVER_ENDPOINT = process.env.REACT_APP_SERVER_ENDPOINT || "http://localhost:5000";

/**
 * Check if the user is currently logged in by calling /api/auth/me.
 * This replaces the old loginHandler that incorrectly sent GET to /api/auth/login.
 */
export const loginHandler = () => {
  return (dispatch) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      dispatch(authAction.isLoginHandler({ isLogin: false }));
      return;
    }

    const url = `${SERVER_ENDPOINT}/api/auth/me`;

    fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Invalid Credential");
        }

        return response.json();
      })
      .then((data) => {
        const user = data.user;
        dispatch(
          userAction.setUserData({
            userData: {
              name: user.name,
              email: user.email,
              profileImg: user.profileImg,
            },
          })
        );
        dispatch(authAction.isLoginHandler({ isLogin: true }));
        localStorage.setItem("isLogin", true);
      })
      .catch((err) => {
        console.log(err);
        dispatch(authAction.isLoginHandler({ isLogin: false }));
        localStorage.removeItem("isLogin");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("loginCheck");
      });
  };
};

/**
 * Logout the user — sends POST to /api/auth/logout (not GET).
 */
export const logoutHandler = () => {
  return (dispatch) => {
    const url = `${SERVER_ENDPOINT}/api/auth/logout`;
    const token = localStorage.getItem("accessToken");

    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Logout failed");
        }
        dispatch(authAction.isLoginHandler({ isLogin: false }));
        localStorage.removeItem("isLogin");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("loginCheck");
        dispatch(
          userAction.setUserData({
            userData: {
              name: "User",
              email: "",
              profileImg: "",
            },
          })
        );
      })
      .catch((err) => {
        console.log(err);
        // Force local cleanup even if server call fails
        dispatch(authAction.isLoginHandler({ isLogin: false }));
        localStorage.removeItem("isLogin");
        localStorage.removeItem("accessToken");
      });
  };
};

/**
 * Refresh the access token using /api/auth/me to validate session.
 * The old refreshToken endpoint (/api/auth/resetToken) doesn't exist.
 */
export const refreshToken = () => {
  return (dispatch) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      dispatch(logoutHandler());
      return;
    }

    const url = `${SERVER_ENDPOINT}/api/auth/me`;

    fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Session expired");
        }
        localStorage.setItem("isLogin", true);
      })
      .catch((err) => {
        console.log(err);
        dispatch(logoutHandler());
      });
  };
};
