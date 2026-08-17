import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || "https://pkfdbgwavkblnzabdpmd.supabase.co";
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY || "sb_publishable_m4_rS_o6JccfKkdgqAM2YQ_gR4vomEq";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: false,
    persistSession: true,
    autoRefreshToken: false,
  },
  realtime: {
    enabled: false,
  },
});


