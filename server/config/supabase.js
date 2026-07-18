import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const isLegacyServiceRoleKey = (key) => {
  if (!key?.startsWith("eyJ")) return false;

  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8"));
    return payload.role === "service_role";
  } catch {
    return false;
  }
};

const isServerOnlyKey = (key) => key?.startsWith("sb_secret_") || isLegacyServiceRoleKey(key);

if (!supabaseUrl || !isServerOnlyKey(supabaseKey)) {
  throw new Error(
    "SUPABASE_URL and a server-only SUPABASE_SERVICE_ROLE_KEY are required. Never use a publishable or anon key on the API server."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);
