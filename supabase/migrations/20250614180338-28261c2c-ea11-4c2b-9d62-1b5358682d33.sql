
-- Update all users to be superadmin
UPDATE public.users
SET role = 'superadmin';
