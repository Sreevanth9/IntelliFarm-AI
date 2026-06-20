-- supabase_schema.sql
-- Run this in your Supabase SQL Editor to set up the tables for IntelliFarm AI

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  profile_img TEXT,
  location TEXT,
  farm_size TEXT DEFAULT '3 acres',
  crops_interested TEXT[] DEFAULT '{}',
  max_rate_limit INTEGER DEFAULT 10,
  current_limit INTEGER DEFAULT 0,
  recent_rate_limit_time BIGINT DEFAULT 0,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  last_failed_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_select ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY user_insert ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY user_update ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY user_delete ON public.users FOR DELETE USING (auth.uid() = id);

-- 2. Community Posts Table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  author_name TEXT DEFAULT 'Farmer',
  question TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY post_select ON public.community_posts FOR SELECT USING (true);
CREATE POLICY post_insert ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY post_update ON public.community_posts FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY post_delete ON public.community_posts FOR DELETE USING (auth.uid() = author_id);

-- 3. Community Comments Table
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_name TEXT DEFAULT 'Farmer',
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY comment_select ON public.community_comments FOR SELECT USING (true);
CREATE POLICY comment_insert ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY comment_update ON public.community_comments FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY comment_delete ON public.community_comments FOR DELETE USING (auth.uid() = author_id);

-- 4. Saved Recommendations Table
CREATE TABLE IF NOT EXISTS public.saved_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.saved_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY recommendation_select ON public.saved_recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY recommendation_insert ON public.saved_recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY recommendation_update ON public.saved_recommendations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY recommendation_delete ON public.saved_recommendations FOR DELETE USING (auth.uid() = user_id);

-- 5. Chat Histories Table
CREATE TABLE IF NOT EXISTS public.chat_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chat_histories ENABLE ROW LEVEL SECURITY;
CREATE POLICY history_select ON public.chat_histories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY history_insert ON public.chat_histories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY history_update ON public.chat_histories FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY history_delete ON public.chat_histories FOR DELETE USING (auth.uid() = user_id);

-- 6. Chats Table
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_history_id UUID REFERENCES public.chat_histories(id) ON DELETE CASCADE NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY chat_select ON public.chats FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chat_histories WHERE id = chat_history_id AND user_id = auth.uid())
);
CREATE POLICY chat_insert ON public.chats FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.chat_histories WHERE id = chat_history_id AND user_id = auth.uid())
);
CREATE POLICY chat_update ON public.chats FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.chat_histories WHERE id = chat_history_id AND user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.chat_histories WHERE id = chat_history_id AND user_id = auth.uid())
);
CREATE POLICY chat_delete ON public.chats FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.chat_histories WHERE id = chat_history_id AND user_id = auth.uid())
);

-- 7. Weather Caches Table
CREATE TABLE IF NOT EXISTS public.weather_caches (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.weather_caches ENABLE ROW LEVEL SECURITY;
CREATE POLICY cache_select ON public.weather_caches FOR SELECT USING (true);
-- cache_write removed: writes are handled exclusively by backend service role

-- 8. Disease Reports Table
CREATE TABLE IF NOT EXISTS public.disease_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  disease_name TEXT NOT NULL,
  symptoms TEXT,
  treatment TEXT,
  prevention TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.disease_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY disease_select ON public.disease_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY disease_insert ON public.disease_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY disease_update ON public.disease_reports FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY disease_delete ON public.disease_reports FOR DELETE USING (auth.uid() = user_id);

-- 9. Farms Table
CREATE TABLE IF NOT EXISTS public.farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  farm_name TEXT NOT NULL,
  location TEXT,
  crop TEXT NOT NULL,
  soil_type TEXT NOT NULL,
  area TEXT NOT NULL,
  sowing_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY farm_select ON public.farms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY farm_insert ON public.farms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY farm_update ON public.farms FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY farm_delete ON public.farms FOR DELETE USING (auth.uid() = user_id);

-- 10. Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  category TEXT NOT NULL CHECK (category IN ('weather', 'disease', 'crop', 'market')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY alert_select ON public.alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY alert_insert ON public.alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY alert_update ON public.alerts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY alert_delete ON public.alerts FOR DELETE USING (auth.uid() = user_id);

-- 11. User Sessions Table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY session_select ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY session_insert ON public.user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY session_update ON public.user_sessions FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY session_delete ON public.user_sessions FOR DELETE USING (auth.uid() = user_id);

-- 12. Security Logs Table
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY logs_select ON public.security_logs FOR SELECT USING (auth.uid() = user_id);
-- logs_insert removed: insertion is only allowed from backend service role

-- 13. Password History Table
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
-- pwhist_select removed: password history should never be readable from the frontend

-- 14. AI Audit Logs Table
CREATE TABLE IF NOT EXISTS public.ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  is_flagged BOOLEAN DEFAULT false,
  flagged_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_select ON public.ai_audit_logs FOR SELECT USING (auth.uid() = user_id);
-- ai_insert removed: insertion is only allowed from backend service role

-- 15. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON public.farms(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_histories_user_id ON public.chat_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_disease_reports_user_id ON public.disease_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
