
-- 1. Create owner if not exists
INSERT INTO users (name, email, password, role, is_active)
SELECT 'Manoj Reddy', 'manojreddy@fuelsync.com', 'password', 'owner', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'manojreddy@fuelsync.com');

-- 2. Create two stations for Manoj (if not exist)
DO $$
DECLARE
  owner_id INTEGER;
  station1_id INTEGER;
  station2_id INTEGER;
BEGIN
  SELECT id INTO owner_id FROM users WHERE email = 'manojreddy@fuelsync.com';

  IF NOT EXISTS (SELECT 1 FROM stations WHERE name = 'Fuelsync Alpha') THEN
    INSERT INTO stations (name, brand, address, owner_id, is_active)
    VALUES ('Fuelsync Alpha', 'BPCL', 'Alpha Road', owner_id, TRUE);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM stations WHERE name = 'Fuelsync Beta') THEN
    INSERT INTO stations (name, brand, address, owner_id, is_active)
    VALUES ('Fuelsync Beta', 'IOCL', 'Beta Road', owner_id, TRUE);
  END IF;
END $$;
