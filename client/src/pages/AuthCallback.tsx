import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { completeOAuthRedirect, isAuthenticated } = useAuth() as any;
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    completeOAuthRedirect()
      .then((user: any) => {
        if (!cancelled && user) navigate("/dashboard", { replace: true });
      })
      .catch((err: any) => {
        console.error("OAuth callback sync failed:", err);
        if (!cancelled) {
          const detail = err.response?.data?.message
            ? `${err.message}: ${err.response.data.message}`
            : (err.stack || err.message || "Unknown error occurred");
          setError(detail);

          // Report the error to the backend error logger
          const logPayload = {
            message: err.message,
            stack: err.stack,
            responseStatus: err.response?.status,
            responseData: err.response?.data,
            location: window.location.href,
          };
          fetch("/api/auth/log-error", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(logPayload),
          }).catch(() => {});

          setTimeout(() => navigate("/login", { replace: true }), 15000);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [completeOAuthRedirect, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "radial-gradient(circle at top left, rgba(82, 183, 136, 0.15), transparent 30%), radial-gradient(circle at bottom right, rgba(46, 125, 50, 0.15), transparent 30%), #081C15",
      color: "#e9f6e8",
      fontFamily: "'Outfit', 'Inter', sans-serif",
      padding: "24px"
    }}>
      {/* Glass card */}
      <div style={{
        background: "rgba(255, 255, 255, 0.06)",
        backdropFilter: "blur(30px)",
        WebkitBackdropFilter: "blur(30px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "24px",
        padding: "40px",
        textAlign: "center",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.3), 0 0 40px rgba(82, 183, 136, 0.05)",
        maxWidth: "360px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center"
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          border: "3px solid rgba(82, 183, 136, 0.15)",
          borderTop: "3px solid #52b788",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
          marginBottom: "20px",
          boxShadow: "0 0 15px rgba(82, 183, 136, 0.2)"
        }}></div>
        
        <h3 style={{ margin: "0 0 8px 0", fontWeight: "700", color: "#fff", fontSize: "18px" }}>
          {error ? "Sign-in needs attention" : "Signing you in..."}
        </h3>
        <p style={{ margin: 0, opacity: 0.7, fontSize: "13px", lineHeight: "1.4" }}>
          {error || "Please wait while we sync your secure partner credentials."}
        </p>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
