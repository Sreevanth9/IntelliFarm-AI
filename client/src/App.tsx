import React, { useEffect } from "react";
import "./App.css";
import { Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { uiAction } from "./store/ui";
import { Toaster } from "react-hot-toast";
import Dashboard from "./pages/Dashboard";
import DiseaseInfo from "./pages/DiseaseInfo";
import DiseaseDetection from "./pages/DiseaseDetection";
import Fertilizer from "./pages/Fertilizer";
import Irrigation from "./pages/Irrigation";
import Profile from "./pages/Profile";
import Schemes from "./pages/Schemes";
import Weather from "./pages/Weather";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./routes/ProtectedRoute";
import Farms from "./pages/Farms";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Settings from "./pages/Settings";
import CopilotPage from "./pages/CopilotPage";
// Legacy assistant routes redirect to Copilot

const App: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const settingsShow = useSelector((state: any) => state.ui.isSettingsShow);
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
    if (isUserDetails === true) {
      dispatch(uiAction.toggleUserDetailsShow());
    }
  };

  useEffect(() => {
    const getLocalTheme = localStorage.getItem("theme");
    const theme = getLocalTheme || "light";
    document.documentElement.setAttribute("data-theme", theme);
  }, [isDark]);

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
        <Route path="/assistant" element={<Navigate to="/copilot" replace />} />
        <Route path="/assistant/*" element={<Navigate to="/copilot" replace />} />
        <Route path="/app" element={<Navigate to="/copilot" replace />} />
        <Route path="/app/:historyId" element={<Navigate to="/copilot" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/fertilizer" element={<Fertilizer />} />
        <Route path="/schemes" element={<Schemes />} />
        <Route path="/irrigation" element={<Irrigation />} />
        <Route path="/disease-info" element={<DiseaseInfo />} />
        <Route path="/disease-detection" element={<DiseaseDetection />} />
        <Route path="/farms" element={<ProtectedRoute><Farms /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/copilot/*" element={<ProtectedRoute><CopilotPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {isLogin && !location.pathname.startsWith("/copilot")}
      {settingsShow && (
        <div onClick={settingHandler} className="bg-focus-dark"></div>
      )}
      {isUserDetails && isLogin && (
        <div onClick={settingHandler} className="bg-focus-dark"></div>
      )}
    </div>
  );
};

export default App;
