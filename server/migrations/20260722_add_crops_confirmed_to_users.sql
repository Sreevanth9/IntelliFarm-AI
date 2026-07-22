-- Migration: Add crops_confirmed column to public.users table if it does not exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS crops_confirmed BOOLEAN DEFAULT false;
