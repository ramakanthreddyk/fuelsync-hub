
-- Delete all user records so you can cleanly remap with auth users
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
