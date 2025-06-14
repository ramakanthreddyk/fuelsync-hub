
-- Step 1: Drop old users table (integer PK)
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Create new users table with uuid as PK
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  auth_uid uuid,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 3: OCR Uploads table
CREATE TABLE IF NOT EXISTS ocr_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  file_url TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 4: OCR Readings table
CREATE TABLE IF NOT EXISTS ocr_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid REFERENCES ocr_uploads(id) ON DELETE CASCADE,
  pump_serial TEXT NOT NULL,
  reading_date DATE,
  reading_time TIME,
  nozzle_data JSONB NOT NULL, -- [{nozzle_num, cumulative_volume}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ocr_engine TEXT,
  raw_ocr_text TEXT
);

-- Drop all unnecessary old tables
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS prices CASCADE;
DROP TABLE IF EXISTS stations CASCADE;
DROP TABLE IF EXISTS pumps CASCADE;
DROP TABLE IF EXISTS nozzles CASCADE;
DROP TABLE IF EXISTS tender_entries CASCADE;
DROP TABLE IF EXISTS daily_closure CASCADE;
DROP TABLE IF EXISTS plan_usage CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS user_stations CASCADE;
DROP TABLE IF EXISTS pump_assignments CASCADE;
DROP TABLE IF EXISTS nozzle_assignments CASCADE;
DROP TABLE IF EXISTS event_log CASCADE;
