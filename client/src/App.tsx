import React, { useEffect } from "react";
import "./App.css";
import ChatSection from "./components/ChatSection/ChatSection";
import SettingSection from "./components/SettingSection/SettingSecion";
import ChatSidebar from "./components/Sidebar/Sidebar";
import { Navigate, Route, Routes, useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { uiAction } from "./store/ui-gemini";
import { Toaster } from "react-hot-toast";
import { getRecentChat } from "./store/chat-action";
import UserDetails from "./components/UserDetails/UserDetails";
import { refreshToken } from "./store/auth-action";
import { loginHandler } from "./store/auth-action";
import CropAdvisor from "./pages/CropAdvisor";
import Dashboard from "./pages/Dashboard";
import DiseaseInfo from "./pages/DiseaseInfo";
import DiseaseDetection from "./pages/DiseaseDetection";
import Community from "./pages/Community";
import Fertilizer from "./pages/Fertilizer";
import Irrigation from "./pages/Irrigation";
import MarketPrices from "./pages/MarketPrices";
import Profile from "./pages/Profile";
import Schemes from "./pages/Schemes";
import Weather from "./pages/Weather";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import Farms from "./pages/Farms";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Alerts from "./pages/Alerts";
import Settings from "./pages/Settings";
import FloatingChat from "./components/FloatingChat";

const LegacyChatRedirect: React.FC = () => {
  const { historyId } = useParams<{ historyId?: string }>();
  return (
    <Navigate
      to={historyId ? `/assistant/app/${historyId}` : "/assistant/app"}
      replace
    />
  );
};

const App: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const settingsShow = useSelector((state: any) => state.ui.isSettingsShow);
  const isAdvanceGeminiPrompt = useSelector((state: any) => state.ui.isAdvanceShow);
  const newChat = useSelector((state: any) => state.chat.newChat);
  const isDark = useSelector((state: any) => state.ui.isDark);
  const isUserDetails = useSelector((state: any) => state.ui.isUserDetailsShow);
  const isLogin = useSelector((state: any) => state.auth.isLogin);

  useEffect(() => {
    if (isLogin && (location.pathname === "/" || location.pathname === "/login")) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLogin, location.pathname, navigate]);

  const settingHandler = () => {
    if (settingsShow === true) {
      dispatch(uiAction.toggleSettings());
    }
    if (isAdvanceGeminiPrompt === true) {
      dispatch(uiAction.toggleAdvanceShow());
    }

    if (isUserDetails === true) {
      dispatch(uiAction.toggleUserDetailsShow());
    }
  };

  useEffect(() => {
    const getLocalTheme = localStorage.getItem("theme");
    const theme = getLocalTheme || "dark";
    document.documentElement.setAttribute("data-theme", theme);
  }, [isDark]);

  useEffect(() => {
    if (newChat === false) {
      dispatch(getRecentChat() as any);
    }
  }, [dispatch, newChat]);

  useEffect(() => {
    dispatch(loginHandler() as any);
  }, [dispatch]);



  useEffect(() => {
    const refreshTokenHandler = setInterval(() => {
      const isLoginLocal = localStorage.getItem("isLogin");
      if (isLoginLocal) {
        dispatch(refreshToken() as any);
      }
    }, 14 * 60 * 1000);

    return () => clearInterval(refreshTokenHandler);
  }, [dispatch]);

  return (
    <div className="App">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2600,
          style: {
            border: "1px solid rgba(46, 125, 50, 0.18)",
            color: "#183d24",
          },
        }}
      />
      <Routes>
        <Route
          path="/"
          element={
            isLogin ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/about"
          element={
            isLogin ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/services"
          element={
            isLogin ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/contact"
          element={
            isLogin ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/assistant/*"
          element={
            <>
              <ChatSidebar />
              <ChatSection />
              <SettingSection />
              {isUserDetails && isLogin && <UserDetails />}
            </>
          }
        />
        <Route path="/app" element={<LegacyChatRedirect />} />
        <Route path="/app/:historyId" element={<LegacyChatRedirect />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/crop-advisor" element={<CropAdvisor />} />
        <Route path="/fertilizer" element={<Fertilizer />} />
        <Route path="/market-prices" element={<MarketPrices />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/irrigation" element={<Irrigation />} />
        <Route path="/disease-info" element={<DiseaseInfo />} />
        <Route path="/disease-detection" element={<DiseaseDetection />} />
        <Route path="/farms" element={<ProtectedRoute><Farms /></ProtectedRoute>} />
        <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {isLogin && <FloatingChat />}
      {settingsShow && (
        <div onClick={settingHandler} className="bg-focus-dark"></div>
      )}
      {isAdvanceGeminiPrompt && (
        <div onClick={settingHandler} className="bg-focus-dark"></div>
      )}
      {isUserDetails && isLogin && (
        <div onClick={settingHandler} className="bg-focus-dark"></div>
      )}
    </div>
  );
};

export default App;
