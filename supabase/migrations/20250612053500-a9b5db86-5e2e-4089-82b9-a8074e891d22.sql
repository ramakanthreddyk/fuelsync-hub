
-- Drop existing tables to start fresh with the new schema
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS discrepancies CASCADE;
DROP TABLE IF EXISTS fuel_stocks CASCADE;
DROP TABLE IF EXISTS refills CASCADE;
DROP TABLE IF EXISTS petrol_pumps CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS employee_role CASCADE;
DROP TYPE IF EXISTS employee_status CASCADE;
DROP TYPE IF EXISTS fuel_type CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;

-- Create new enum types for the fuel station schema
CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'employee');
CREATE TYPE station_brand AS ENUM ('IOCL', 'BPCL', 'HPCL');
CREATE TYPE fuel_type AS ENUM ('PETROL', 'DIESEL', 'CNG', 'EV');
CREATE TYPE reading_source AS ENUM ('ocr', 'manual');
CREATE TYPE tender_type AS ENUM ('cash', 'card', 'upi', 'credit');

-- 1. Plans table (referenced by stations, so create first)
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

-- 2. Users table (referenced by stations as owner, so create before stations)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  role user_role NOT NULL,
  station_id INT, -- Will be set after stations table is created
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Stations table
CREATE TABLE stations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  brand station_brand NOT NULL,
  address TEXT,
  owner_id INT NOT NULL REFERENCES users(id),
  current_plan_id INT REFERENCES plans(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Add foreign key constraint to users.station_id after stations table exists
ALTER TABLE users ADD CONSTRAINT fk_users_station FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE SET NULL;

-- 5. Station plans (subscription history)
CREATE TABLE station_plans (
  station_id INT REFERENCES stations(id) ON DELETE CASCADE,
  plan_id INT REFERENCES plans(id),
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  is_paid BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (station_id, effective_from)
);

-- 6. Pumps table
CREATE TABLE pumps (
  id SERIAL PRIMARY KEY,
  station_id INT NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  pump_sno TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (station_id, pump_sno)
);

-- 7. Nozzles table
CREATE TABLE nozzles (
  id SERIAL PRIMARY KEY,
  pump_id INT NOT NULL REFERENCES pumps(id) ON DELETE CASCADE,
  nozzle_number INT NOT NULL,
  fuel_type fuel_type NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (pump_id, nozzle_number)
);

-- 8. OCR readings table
CREATE TABLE ocr_readings (
  id SERIAL PRIMARY KEY,
  station_id INT NOT NULL REFERENCES stations(id),
  nozzle_id INT NOT NULL REFERENCES nozzles(id),
  source reading_source NOT NULL,
  reading_date DATE NOT NULL,
  reading_time TIME NOT NULL,
  cumulative_vol NUMERIC(12,2) NOT NULL,
  image_url TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (nozzle_id, reading_date, reading_time)
);

-- 9. Fuel prices table
CREATE TABLE fuel_prices (
  id SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(id),
  fuel_type fuel_type NOT NULL,
  price_per_litre NUMERIC(8,3) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Sales table (calculated from readings)
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

-- 11. Tender entries table (cash/card/credit received)
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

-- 12. Daily closure table (reconciliation)
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

-- 13. Plan usage tracking
CREATE TABLE plan_usage (
  station_id INT REFERENCES stations(id),
  month DATE,
  ocr_count INT DEFAULT 0,
  pumps_used INT DEFAULT 0,
  nozzles_used INT DEFAULT 0,
  employees_count INT DEFAULT 0,
  PRIMARY KEY (station_id, month)
);

-- Insert sample plans
INSERT INTO plans (name, price_monthly, max_pumps, max_nozzles, max_employees, max_ocr_monthly, allow_manual_entry, edit_fuel_type, export_reports, features) VALUES
('Free', 0, 2, 4, 2, 10, TRUE, FALSE, FALSE, '{"basic_reports": true}'::jsonb),
('Basic', 999, 5, 10, 5, 50, TRUE, TRUE, TRUE, '{"basic_reports": true, "analytics": true}'::jsonb),
('Premium', 2999, 20, 50, 20, 200, TRUE, TRUE, TRUE, '{"basic_reports": true, "analytics": true, "advanced_reports": true, "api_access": true}'::jsonb);

-- Insert sample superadmin user (password: admin123)
INSERT INTO users (name, email, phone, password, role, is_active) VALUES
('Super Admin', 'admin@mygas.com', '+91-9999999999', '$2a$12$LQv3c1yqBwEHJ/OKL2XfOOHyFaFDK8K8Y0XQNOXwpx7LfGMGzV/ta', 'superadmin', TRUE);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_station_id ON users(station_id);
CREATE INDEX idx_stations_owner ON stations(owner_id);
CREATE INDEX idx_pumps_station ON pumps(station_id);
CREATE INDEX idx_nozzles_pump ON nozzles(pump_id);
CREATE INDEX idx_ocr_readings_station_date ON ocr_readings(station_id, reading_date);
CREATE INDEX idx_ocr_readings_nozzle_date ON ocr_readings(nozzle_id, reading_date);
CREATE INDEX idx_sales_station_date ON sales(station_id, created_at);
CREATE INDEX idx_tender_entries_station_date ON tender_entries(station_id, entry_date);
CREATE INDEX idx_fuel_prices_station_fuel ON fuel_prices(station_id, fuel_type, valid_from);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at columns where needed
ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE stations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE pumps ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE nozzles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pumps_updated_at BEFORE UPDATE ON pumps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nozzles_updated_at BEFORE UPDATE ON nozzles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
