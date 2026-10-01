import "./loadEnv.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseSecretKey =
  process.env.SUPABASE_SECRET_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

const isLegacyServiceRoleKey = (key) => {
  const parts = key.split(".");
  if (parts.length !== 3) return false;

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return payload.role === "service_role";
  } catch {
    return false;
  }
};

if (!supabaseUrl || /placeholder|your[_-]?supabase/i.test(supabaseUrl)) {
  throw new Error("Supabase configuration error: set SUPABASE_URL in server/.env.");
}

try {
  const parsedUrl = new URL(supabaseUrl);
  if (!new Set(["http:", "https:"]).has(parsedUrl.protocol)) throw new Error();
} catch {
  throw new Error("Supabase configuration error: SUPABASE_URL must be a valid HTTP or HTTPS URL.");
}

const hasSecretKey =
  supabaseSecretKey &&
  !/placeholder|your[_-]?supabase/i.test(supabaseSecretKey) &&
  (supabaseSecretKey.startsWith("sb_secret_") || isLegacyServiceRoleKey(supabaseSecretKey));

if (!hasSecretKey) {
  throw new Error(
    "Supabase configuration error: set SUPABASE_SECRET_KEY or a valid SUPABASE_SERVICE_ROLE_KEY in server/.env. A publishable/anon key cannot be used by the backend."
  );
}

export const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
