
-- Set the role of manojreddy@fuelsync.com to owner
UPDATE public.users
SET role = 'owner'
WHERE email = 'manojreddy@fuelsync.com';
