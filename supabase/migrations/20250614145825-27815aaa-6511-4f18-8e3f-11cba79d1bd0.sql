
-- FUELSYNC DEMO SCHEMA BOOTSTRAP MIGRATION

-- Enable pgcrypto for UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'employee');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_brand') THEN
    CREATE TYPE fuel_brand AS ENUM ('IOCL', 'BPCL', 'HPCL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_type') THEN
    CREATE TYPE fuel_type AS ENUM ('PETROL', 'DIESEL');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ocr_source') THEN
    CREATE TYPE ocr_source AS ENUM ('ocr', 'manual');
  END IF;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  role user_role NOT NULL DEFAULT 'employee',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly NUMERIC,
  max_pumps INT,
  max_nozzles INT,
  max_employees INT,
  max_ocr_monthly INT,
  allow_manual_entry BOOLEAN DEFAULT TRUE,
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  brand fuel_brand NOT NULL,
  address TEXT,
  owner_id UUID REFERENCES users(id),
  current_plan_id INT REFERENCES plans(id),
  plan_id INT REFERENCES plans(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User-Station assignment table
CREATE TABLE IF NOT EXISTS user_stations (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  station_id INT REFERENCES stations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(user_id, station_id)
);

-- Pumps table
CREATE TABLE IF NOT EXISTS pumps (
  id SERIAL PRIMARY KEY,
  station_id INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  pump_sno TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (station_id, pump_sno)
);

-- Nozzles table
CREATE TABLE IF NOT EXISTS nozzles (
  id SERIAL PRIMARY KEY,
  pump_id INT NOT NULL REFERENCES pumps(id) ON DELETE CASCADE,
  nozzle_number INT NOT NULL,
  fuel_type fuel_type NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (pump_id, nozzle_number)
);

-- Fuel Prices table
CREATE TABLE IF NOT EXISTS fuel_prices (
  id SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(id),
  fuel_type fuel_type NOT NULL,
  price_per_litre NUMERIC NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  valid_from TIMESTAMPTZ DEFAULT now()
);

-- OCR readings table (for demo/testing: minimal columns)
CREATE TABLE IF NOT EXISTS ocr_readings (
  id SERIAL PRIMARY KEY,
  station_id INT NOT NULL REFERENCES stations(id),
  nozzle_id INT NOT NULL REFERENCES nozzles(id),
  pump_sno TEXT NOT NULL DEFAULT '',
  reading_date DATE NOT NULL,
  reading_time TIME NOT NULL,
  cumulative_vol NUMERIC NOT NULL,
  source ocr_source NOT NULL DEFAULT 'ocr',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for test
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_stations_owner ON stations(owner_id);

-- ========== END MIGRATION ==========
