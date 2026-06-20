import { supabase } from "../config/supabase.js";

// Structured Security Logger to log security-sensitive events
export const logSecurityEvent = async ({ eventType, userId, ipAddress, endpoint, details }) => {
  const ip = ipAddress || "0.0.0.0";
  const route = endpoint || "unknown";
  
  // Format standard log entry
  const logEntry = {
    event: eventType,
    userId: userId || "guest",
    ip,
    endpoint: route,
    timestamp: new Date().toISOString(),
    details: details || {}
  };

  // Warn console output
  console.warn(`[SECURITY AUDIT] ${JSON.stringify(logEntry)}`);

  try {
    const { error } = await supabase
      .from("security_logs")
      .insert({
        event_type: eventType,
        user_id: userId || null,
        ip_address: ip,
        endpoint: route,
        details: details || {},
      });

    if (error) {
      console.error("Database log persistence failed:", error.message);
    }
  } catch (err) {
    console.error("Security event logger execution failed:", err.message);
  }
};
