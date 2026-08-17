import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || "https://pkfdbgwavkblnzabdpmd.supabase.co";
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-o7N7_UpXZ08wWqZN5ooV5VG3n_8Kf7i_hA6Gpmw6w";

let client;
try {
  client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: false,
    },
    realtime: {
      enabled: false,
    },
  });
} catch (e) {
  client = {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    },
  };
}

export const supabase = client;

