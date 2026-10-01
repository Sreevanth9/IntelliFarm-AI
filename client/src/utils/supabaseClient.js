import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL?.trim();
const supabasePublishableKey =
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  process.env.REACT_APP_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Supabase configuration error: set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_PUBLISHABLE_KEY in client/.env."
  );
}

if (
  /placeholder|your[_-]?supabase/i.test(supabaseUrl) ||
  /placeholder|your[_-]?supabase/i.test(supabasePublishableKey) ||
  supabasePublishableKey.startsWith("sb_secret_")
) {
  throw new Error("Supabase configuration error: the client needs a valid publishable key and project URL.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: true,
  },
});

