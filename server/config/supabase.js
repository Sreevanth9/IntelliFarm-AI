import "./loadEnv.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://pkfdbgwavkblnzabdpmd.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder")
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-o7N7_UpXZ08wWqZN5ooV5VG3n_8Kf7i_hA6Gpmw6w";

let client;
try {
  client = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    realtime: {
      enabled: false,
    },
  });
} catch (err) {
  console.warn("[SUPABASE WARNING]: Initialized with fallback mock client.");
  client = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  };
}

export const supabase = client;

