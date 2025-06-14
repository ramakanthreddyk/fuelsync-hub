
-- Add is_active column to the users table for compatibility with app logic
ALTER TABLE public.users
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
-- Optionally, add an index to support filtering
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
