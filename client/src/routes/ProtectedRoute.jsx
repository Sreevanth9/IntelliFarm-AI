import { Navigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, initializing } = useAuth();

  useEffect(() => {
    if (!initializing && !isAuthenticated) {
      toast.error("Please login to open this module");
    }
  }, [initializing, isAuthenticated]);

  if (initializing) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "var(--background-color, #f8fafc)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", border: "3px solid #2e7d32", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: "14px", color: "#64748b", fontWeight: 500 }}>Loading IntelliFarm AI...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
