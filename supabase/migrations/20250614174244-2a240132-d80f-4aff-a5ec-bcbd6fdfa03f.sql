
-- 1. Create the user_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'employee');
  END IF;
END
$$;

-- 2. (Re)create the handle_new_auth_user function
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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

-- 3. Attach the trigger to auth.users for AFTER INSERT events (remove existing first to avoid dupes)
DROP TRIGGER IF EXISTS after_auth_user_created ON auth.users;
CREATE TRIGGER after_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
