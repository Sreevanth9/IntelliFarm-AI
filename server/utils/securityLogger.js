import { supabase } from "../config/supabase.js";

const SENSITIVE_DETAIL_KEYS = /(?:token|secret|password|authorization|cookie|api[_-]?key)/i;

const redactSensitiveDetails = (value, key = "") => {
  if (SENSITIVE_DETAIL_KEYS.test(key)) return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item) => redactSensitiveDetails(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, redactSensitiveDetails(entryValue, entryKey)])
    );
  }
  return value;
};

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
    details: redactSensitiveDetails(details || {})
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
        details: logEntry.details,
      });

    if (error) {
      console.error("Database log persistence failed:", error.message);
    }
  } catch (err) {
    console.error("Security event logger execution failed:", err.message);
  }
};
