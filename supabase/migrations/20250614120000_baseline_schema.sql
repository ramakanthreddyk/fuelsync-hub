
-- Baseline Migration: Complete FuelSync Database Schema
-- This migration captures the current production state of the database

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom enum types
CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'employee');
CREATE TYPE fuel_brand AS ENUM ('IOCL', 'BPCL', 'HPCL');
CREATE TYPE fuel_type AS ENUM ('PETROL', 'DIESEL', 'CNG', 'EV');
CREATE TYPE ocr_source AS ENUM ('ocr', 'manual');
CREATE TYPE tender_type AS ENUM ('cash', 'card', 'upi', 'credit');

-- Plans table
CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly NUMERIC(10, 2),
  max_pumps INT,
  max_nozzles INT,
  max_employees INT,
  max_ocr_monthly INT,
  allow_manual_entry BOOLEAN DEFAULT TRUE,
  edit_fuel_type BOOLEAN DEFAULT TRUE,
  export_reports BOOLEAN DEFAULT FALSE,
  features JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'employee',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Stations table
CREATE TABLE stations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  brand fuel_brand NOT NULL,
  address TEXT,
  owner_id INT REFERENCES users(id),
  current_plan_id INT REFERENCES plans(id),
  plan_id INT REFERENCES plans(id),
  is_active BOOLEAN DEFAULT TRUE,
  is_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User-Station junction table
CREATE TABLE user_stations (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  station_id INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, station_id)
);

-- Station plans (subscription history)
CREATE TABLE station_plans (
  id SERIAL PRIMARY KEY,
  station_id INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  plan_id INT NOT NULL REFERENCES plans(id),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_paid BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Pumps table
CREATE TABLE pumps (
  id SERIAL PRIMARY KEY,
  station_id INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  pump_sno TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (station_id, pump_sno)
);

-- Nozzles table
CREATE TABLE nozzles (
  id SERIAL PRIMARY KEY,
  pump_id INT NOT NULL REFERENCES pumps(id) ON DELETE CASCADE,
  nozzle_number INT NOT NULL,
  fuel_type fuel_type NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (pump_id, nozzle_number)
);

-- OCR readings table
CREATE TABLE ocr_readings (
  id SERIAL PRIMARY KEY,
  station_id INT NOT NULL REFERENCES stations(id),
  nozzle_id INT NOT NULL REFERENCES nozzles(id),
  pump_sno TEXT NOT NULL DEFAULT '',
  source ocr_source NOT NULL,
  reading_date DATE NOT NULL,
  reading_time TIME NOT NULL,
  cumulative_vol NUMERIC(12,2) NOT NULL,
  image_url TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (nozzle_id, reading_date, reading_time)
);

-- Fuel prices table
CREATE TABLE fuel_prices (
  id SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(id),
  fuel_type fuel_type NOT NULL,
  price_per_litre NUMERIC(8,3) NOT NULL,
  valid_from TIMESTAMPTZ DEFAULT now(),
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sales table (calculated from readings)
CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(id),
  nozzle_id INT REFERENCES nozzles(id),
  reading_id INT REFERENCES ocr_readings(id),
  delta_volume_l NUMERIC(12,2),
  price_per_litre NUMERIC(8,3),
  total_amount NUMERIC(14,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tender entries table
CREATE TABLE tender_entries (
  id SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(id),
  entry_date DATE NOT NULL,
  type tender_type,
  payer TEXT,
  amount NUMERIC(14,2) CHECK (amount >= 0),
  user_id INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Daily closure table
CREATE TABLE daily_closure (
  station_id INT REFERENCES stations(id),
  date DATE NOT NULL,
  sales_total NUMERIC(14,2),
  tender_total NUMERIC(14,2),
  difference NUMERIC(14,2),
  closed_by INT REFERENCES users(id),
  closed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (station_id, date)
);

-- Plan usage tracking
CREATE TABLE plan_usage (
  station_id INT REFERENCES stations(id),
  month DATE,
  ocr_count INT DEFAULT 0,
  pumps_used INT DEFAULT 0,
  nozzles_used INT DEFAULT 0,
  employees_count INT DEFAULT 0,
  PRIMARY KEY (station_id, month)
);

-- Event log table
CREATE TABLE event_log (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  station_id INT REFERENCES stations(id),
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ DEFAULT now()
);

-- Tank inventory table
CREATE TABLE tank_inventory (
  station_id INT NOT NULL REFERENCES stations(id),
  fuel_type fuel_type NOT NULL,
  current_level_l NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (station_id, fuel_type)
);

-- Tank refills table
CREATE TABLE tank_refills (
  id SERIAL PRIMARY KEY,
  station_id INT NOT NULL REFERENCES stations(id),
  fuel_type fuel_type NOT NULL,
  quantity_l NUMERIC NOT NULL,
  filled_by INT REFERENCES users(id),
  filled_at TIMESTAMPTZ DEFAULT now()
);

-- Assignment tables for flexibility
CREATE TABLE pump_assignments (
  id SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(id),
  pump_id INT REFERENCES pumps(id),
  assigned_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE nozzle_assignments (
  id SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(id),
  nozzle_id INT REFERENCES nozzles(id),
  assigned_at TIMESTAMPTZ DEFAULT now()
);

-- Current station plans view (for active plans)
CREATE TABLE current_station_plans (
  station_id INT,
  plan_id INT,
  effective_from TIMESTAMPTZ,
  is_paid BOOLEAN
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_user_stations_user_id ON user_stations(user_id);
CREATE INDEX idx_user_stations_station_id ON user_stations(station_id);
CREATE INDEX idx_stations_owner ON stations(owner_id);
CREATE INDEX idx_pumps_station ON pumps(station_id);
CREATE INDEX idx_nozzles_pump ON nozzles(pump_id);
CREATE INDEX idx_ocr_readings_station_date ON ocr_readings(station_id, reading_date);
CREATE INDEX idx_ocr_readings_nozzle_date ON ocr_readings(nozzle_id, reading_date);
CREATE INDEX idx_sales_station_date ON sales(station_id, created_at);
CREATE INDEX idx_tender_entries_station_date ON tender_entries(station_id, entry_date);
CREATE INDEX idx_fuel_prices_station_fuel ON fuel_prices(station_id, fuel_type, valid_from);

-- Create update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stations_updated_at 
  BEFORE UPDATE ON stations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pumps_updated_at 
  BEFORE UPDATE ON pumps 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nozzles_updated_at 
  BEFORE UPDATE ON nozzles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function for OCR usage tracking
CREATE OR REPLACE FUNCTION increment_ocr_usage(p_station_id integer, p_month date)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO plan_usage (station_id, month, ocr_count)
    VALUES (p_station_id, p_month, 1)
    ON CONFLICT (station_id, month)
    DO UPDATE SET ocr_count = plan_usage.ocr_count + 1;
END;
$$;

-- Create function for logging station plan changes
CREATE OR REPLACE FUNCTION log_station_plan_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.current_plan_id IS DISTINCT FROM OLD.current_plan_id THEN
    INSERT INTO station_plans (station_id, plan_id, effective_from, is_paid, notes)
    VALUES (NEW.id, NEW.current_plan_id, now(), false, 'Auto-tracked from update');
  END IF;
  RETURN NEW;
END;
$$;

-- Add trigger for station plan changes
CREATE TRIGGER log_plan_changes 
  AFTER UPDATE ON stations 
  FOR EACH ROW EXECUTE FUNCTION log_station_plan_change();
