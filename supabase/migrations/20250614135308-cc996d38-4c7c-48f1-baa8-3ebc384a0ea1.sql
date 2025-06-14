
-- Step 1: Add auth_uid to users for secure mapping to Supabase Auth
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_uid UUID UNIQUE;

-- Step 2: Create an index on auth_uid for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_uid_idx ON users(auth_uid);

-- Step 3: (OPTIONAL) Add a comment so team/devs don't use this for business logic
COMMENT ON COLUMN users.auth_uid IS 'References auth.users.id (for secure row-level access)';
