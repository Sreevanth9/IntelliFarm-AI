import { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from "react";
import { useDispatch } from "react-redux";

import { authAction } from "../store/auth";
import { userAction } from "../store/user";
import {
  fetchCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  oauthLoginUser,
} from "../services/authApi";
import { supabase } from "../utils/supabaseClient";

const AuthContext = createContext(null);

const fallbackFarmer = {
  name: "Demo Farmer",
  location: "Hyderabad, Telangana",
  farmSize: "3 acres",
  cropsInterested: ["Paddy", "Tomato", "Maize"],
};

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [farmer, setFarmer] = useState(fallbackFarmer);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("accessToken"))
  );
  const [loading, setLoading] = useState(false);
  const syncingRef = useRef(false);

  const applySession = useCallback(
    (user, token) => {
      if (token) {
        localStorage.setItem("accessToken", token);
      }
      localStorage.setItem("isLogin", "true");
      setFarmer({
        ...fallbackFarmer,
        ...user,
        cropsInterested: user?.cropsInterested?.length
          ? user.cropsInterested
          : fallbackFarmer.cropsInterested,
      });
      setIsAuthenticated(true);
      dispatch(authAction.isLoginHandler({ isLogin: true }));
      dispatch(
        userAction.setUserData({
          userData: {
            name: user.name,
            email: user.email,
            profileImg: user.profileImg || user.profile_img || "",
          },
        })
      );
    },
    [dispatch]
  );

  const clearSession = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("isLogin");
    setFarmer(fallbackFarmer);
    setIsAuthenticated(false);
    dispatch(authAction.isLoginHandler({ isLogin: false }));
    dispatch(
      userAction.setUserData({
        userData: {
          name: "User",
          email: "",
          profileImg: "",
        },
      })
    );
  }, [dispatch]);

  const login = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        const { data } = await loginUser(payload);
        applySession(data.user, data.token);
        return data.user;
      } finally {
        setLoading(false);
      }
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        const { data } = await registerUser(payload);
        applySession(data.user, data.token);
        return data.user;
      } finally {
        setLoading(false);
      }
    },
    [applySession]
  );

  const loginWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGithub = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutUser().catch(() => {});
      await supabase.auth.signOut().catch(() => {});
    } finally {
      clearSession();
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "USER_UPDATED" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") && session) {
        const localToken = localStorage.getItem("accessToken");
        if (!localToken && !syncingRef.current) {
          syncingRef.current = true;
          setLoading(true);
          try {
            const userMetadata = session.user.user_metadata;
            const payload = {
              id: session.user.id,
              email: session.user.email,
              name: userMetadata.full_name || userMetadata.name || session.user.email?.split("@")[0] || "Farmer",
              profileImg: userMetadata.avatar_url || userMetadata.picture,
            };
            const { data } = await oauthLoginUser(payload);
            applySession(data.user, data.token);
          } catch (err) {
            console.error("OAuth login sync error:", err);
            await supabase.auth.signOut().catch(() => {});
          } finally {
            setLoading(false);
            syncingRef.current = false;
          }
        }
      } else if (event === "SIGNED_OUT") {
        clearSession();
        syncingRef.current = false;
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [applySession, clearSession]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    fetchCurrentUser()
      .then(({ data }) => applySession(data.user, token))
      .catch(() => clearSession());
  }, [applySession, clearSession]);

  const value = useMemo(
    () => ({
      farmer,
      isAuthenticated,
      loading,
      login,
      logout,
      register,
      loginWithGoogle,
      loginWithGithub,
    }),
    [farmer, isAuthenticated, loading, login, logout, register, loginWithGoogle, loginWithGithub]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
