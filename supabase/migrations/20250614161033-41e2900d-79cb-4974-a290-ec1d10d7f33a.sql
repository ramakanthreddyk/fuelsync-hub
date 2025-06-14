
-- Create a function to properly insert admin user with enum casting
CREATE OR REPLACE FUNCTION create_admin_user(user_email TEXT, user_name TEXT)
RETURNS TABLE(id UUID, email TEXT, name TEXT, role user_role)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO public.users (email, name, role, is_active, created_at, updated_at)
  VALUES (user_email, user_name, 'superadmin'::user_role, TRUE, now(), now())
  RETURNING users.id, users.email, users.name, users.role;
END;
$$;
