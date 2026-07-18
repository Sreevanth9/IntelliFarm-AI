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
import { ensureCsrfToken } from "../services/api";
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const syncingRef = useRef(false);

  const applySession = useCallback(
    (user) => {
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
    localStorage.removeItem("accessToken"); // Clear the legacy insecure token after upgrade.
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
        applySession(data.user);
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
        applySession(data.user);
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
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeOAuthRedirect = useCallback(async () => {
    if (syncingRef.current) return null;

    syncingRef.current = true;
    setLoading(true);
    try {
      const callbackUrl = new URL(window.location.href);
      if (callbackUrl.searchParams.has("code")) {
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
        if (error) throw error;
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session?.access_token) {
        throw new Error("Google sign-in did not return a Supabase session.");
      }

      const { data } = await oauthLoginUser(sessionData.session.access_token);
      applySession(data.user);
      return data.user;
    } finally {
      setLoading(false);
      syncingRef.current = false;
    }
  }, [applySession]);

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      // OAuth credential exchange is completed exactly once by AuthCallback.
      // Duplicating it here races the callback and can trigger rate limits.
      if (event === "SIGNED_OUT") {
        clearSession();
        syncingRef.current = false;
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [clearSession]);

  useEffect(() => {
    ensureCsrfToken()
      .then(() => fetchCurrentUser())
      .then(({ data }) => applySession(data.user))
      .catch(() => clearSession());
  }, [applySession, clearSession]);

  useEffect(() => {
    const onSessionExpired = () => clearSession();
    window.addEventListener("intellifarm:session-expired", onSessionExpired);
    return () => window.removeEventListener("intellifarm:session-expired", onSessionExpired);
  }, [clearSession]);

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
      completeOAuthRedirect,
    }),
    [farmer, isAuthenticated, loading, login, logout, register, loginWithGoogle, loginWithGithub, completeOAuthRedirect]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
