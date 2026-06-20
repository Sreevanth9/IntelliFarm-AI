import { Navigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isAllowed = Boolean(isAuthenticated);

  useEffect(() => {
    if (!isAllowed) {
      toast.error("Please login to open this module");
    }
  }, [isAllowed]);

  if (!isAllowed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
