
-- Add new fields to public.users if they don't already exist
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'employee',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add trigger function to mirror auth.users into public.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, is_active, name, phone, role, created_at, updated_at, auth_uid)
  VALUES (
    NEW.id, 
    NEW.email, 
    TRUE, 
    NEW.raw_user_meta_data ->> 'name', 
    NEW.raw_user_meta_data ->> 'phone', 
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'employee'), 
    NEW.created_at, 
    now(),
    NEW.id
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users for automatic mirroring to public.users
DROP TRIGGER IF EXISTS after_auth_user_created ON auth.users;
CREATE TRIGGER after_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Auto-update updated_at on change
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
