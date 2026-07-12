-- supabase_copilot_v2_schema.sql
-- Run this in your Supabase SQL Editor to set up the tables for IntelliFarm Copilot v2
--
-- NOTE ON DATABASE SECURITY:
-- Since the IntelliFarm backend uses a custom JWT authentication system (Express + bcrypt + custom tokens)
-- rather than Supabase Auth, queries coming from the backend are evaluated as public/anonymous by Supabase.
-- As a result, standard RLS policies based on auth.uid() will block inserts.
-- Access control is fully enforced at the Node.js application layer via the requireAuth middleware.
-- Therefore, Row Level Security is disabled for these tables to allow communication with the Express middleware.

-- 1. Copilot Conversations Table
CREATE TABLE IF NOT EXISTS public.copilot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  pinned BOOLEAN DEFAULT false,
  favorite BOOLEAN DEFAULT false,
  last_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security is disabled because Node.js middleware manages access control
ALTER TABLE public.copilot_conversations DISABLE ROW LEVEL SECURITY;

-- 2. Copilot Messages Table
CREATE TABLE IF NOT EXISTS public.copilot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.copilot_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security is disabled because Node.js middleware manages access control
ALTER TABLE public.copilot_messages DISABLE ROW LEVEL SECURITY;

-- 3. Copilot Memories Table
CREATE TABLE IF NOT EXISTS public.copilot_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- e.g., 'crop', 'soil', 'location', 'general'
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 1, -- scale 1-5
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security is disabled because Node.js middleware manages access control
ALTER TABLE public.copilot_memories DISABLE ROW LEVEL SECURITY;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_copilot_conv_user ON public.copilot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_msg_conv ON public.copilot_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_copilot_mem_user ON public.copilot_memories(user_id);
