-- Migration: Synchronize public.users and public.farms tables to match application schema

-- 1. Users Table Columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;

-- 2. Farms Table Columns
ALTER TABLE public.farms ADD COLUMN IF NOT EXISTS crop_variety TEXT;
