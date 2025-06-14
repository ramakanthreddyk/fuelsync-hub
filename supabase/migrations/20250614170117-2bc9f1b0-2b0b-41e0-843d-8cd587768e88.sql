
-- Fix the handle_new_auth_user trigger to be more robust and handle errors better
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
    -- Log the error but don't block user creation
    RAISE WARNING 'Error in handle_new_auth_user: %', SQLERRM;
    RETURN NEW;
END;
$$;
