
-- Create the user_role enum type if it doesn't exist (run this and confirm it works)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) THEN
    CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'employee');
  END IF;
END
$$;
