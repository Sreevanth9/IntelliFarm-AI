-- Migration: Add pincode column to public.users table if it does not exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS pincode TEXT;
