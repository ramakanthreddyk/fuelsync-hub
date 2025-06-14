
-- Hash for password "test123" (bcrypt, 12 rounds)
-- $2a$12$GS/37eaubrtnSCeF9dVCwOLtSEN4S/E5jcPqgTF.d0I9ghiaFV7ua

INSERT INTO public.users (id, email, name, phone, is_active, role, created_at, updated_at, auth_uid)
VALUES (
  gen_random_uuid(),
  'devuser@example.com',
  'Dev User',
  '+911234567890',
  TRUE,
  'employee',
  now(),
  now(),
  NULL
);

-- Optional: Set the password (if Supabase Auth is NOT used) in your own backend.
-- But for Supabase Auth, you must register this email/password using their sign up system so tokens are generated and login works!
