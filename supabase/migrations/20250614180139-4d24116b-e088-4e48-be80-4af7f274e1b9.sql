
-- 1. (RECOMMENDED) Backfill existing public.users from auth.users (if none exist)
INSERT INTO public.users (id, email, is_active, name, phone, role, created_at, updated_at, auth_uid)
SELECT 
  u.id,
  u.email,
  TRUE,
  COALESCE(u.raw_user_meta_data ->> 'name', u.email),
  u.raw_user_meta_data ->> 'phone',
  COALESCE(u.raw_user_meta_data ->> 'role', 'employee')::user_role,
  u.created_at,
  now(),
  u.id
FROM auth.users u
LEFT JOIN public.users pu ON pu.id = u.id
WHERE pu.id IS NULL;

-- 2. Drop any existing trigger (avoids double execution, is safe)
DROP TRIGGER IF EXISTS after_auth_user_created ON auth.users;

-- 3. Create/Replace robust trigger function to sync on new auth.users rows
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    is_active, 
    name, 
    phone, 
    role, 
    created_at, 
    updated_at, 
    auth_uid
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    TRUE, 
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email), 
    NEW.raw_user_meta_data ->> 'phone', 
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'employee')::user_role, 
    NEW.created_at, 
    now(),
    NEW.id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now(),
    auth_uid = EXCLUDED.auth_uid;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_auth_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- 4. Attach the trigger so all new Supabase Auth users instantly appear in public.users
CREATE TRIGGER after_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
