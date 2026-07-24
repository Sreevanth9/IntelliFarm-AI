-- Keep the production users table aligned with the profile-completion flow.
-- Both additions are idempotent and preserve all existing user records.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS pincode TEXT;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS crops_confirmed BOOLEAN NOT NULL DEFAULT false;
