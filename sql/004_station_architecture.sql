
-- FuelSync Multi-Tenant Station Architecture
-- Complete database restructure for station-based fuel management

-- Drop existing tables to recreate with proper structure
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS nozzle_readings CASCADE;
DROP TABLE IF EXISTS ocr_readings CASCADE;
DROP TABLE IF EXISTS uploads CASCADE;
DROP TABLE IF EXISTS nozzles CASCADE;
DROP TABLE IF EXISTS pumps CASCADE;
DROP TABLE IF EXISTS fuel_prices CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS stations CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- Create ENUM types
DO $$
BEGIN
  -- User roles
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('super_admin', 'owner', 'manager', 'employee');
  END IF;
  
  -- Fuel types
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fuel_type') THEN
    CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel');
  END IF;
  
  -- Upload status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'upload_status') THEN
    CREATE TYPE upload_status AS ENUM ('processing', 'success', 'failed');
  END IF;
  
  -- Shifts
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_type') THEN
    CREATE TYPE shift_type AS ENUM ('morning', 'afternoon', 'night');
  END IF;
  
  -- Plan names
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_name') THEN
    CREATE TYPE plan_name AS ENUM ('Free', 'Basic', 'Premium');
  END IF;
END
$$;

-- Plans table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name plan_name NOT NULL UNIQUE,
    upload_limit INTEGER NOT NULL DEFAULT 4,
    max_employees INTEGER NOT NULL DEFAULT 2,
    max_pumps INTEGER NOT NULL DEFAULT 2,
    max_stations INTEGER NOT NULL DEFAULT 1,
    features JSONB NOT NULL DEFAULT '{}',
    price DECIMAL(8,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stations table (multi-tenant core)
CREATE TABLE stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    address JSONB, -- {street, city, state, pincode}
    contact_info JSONB, -- {phone, email, manager_name}
    license_number TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table with station-based isolation
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    station_id UUID REFERENCES stations(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id),
    custom_limits JSONB, -- Super admin overrides
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_owner_has_station CHECK (
        role != 'owner' OR station_id IS NOT NULL
    ),
    CONSTRAINT chk_employee_has_station CHECK (
        role NOT IN ('employee', 'manager') OR station_id IS NOT NULL
    )
);

-- Pumps table with station isolation
CREATE TABLE pumps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    pump_sno TEXT NOT NULL, -- Physical pump serial number
    name TEXT NOT NULL,
    location TEXT, -- Position within station
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    last_maintenance_date DATE,
    installation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique pump serial within station
    UNIQUE(station_id, pump_sno)
);

-- Nozzles table with fuel type mapping
CREATE TABLE nozzles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pump_id UUID NOT NULL REFERENCES pumps(id) ON DELETE CASCADE,
    nozzle_id INTEGER NOT NULL CHECK (nozzle_id BETWEEN 1 AND 8),
    fuel_type fuel_type NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    max_flow_rate DECIMAL(6,2), -- Litres per minute
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique nozzle per pump
    UNIQUE(pump_id, nozzle_id)
);

-- Fuel prices per station
CREATE TABLE fuel_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    fuel_type fuel_type NOT NULL,
    price DECIMAL(8,2) NOT NULL CHECK (price > 0),
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique active price per fuel type per station
    UNIQUE(station_id, fuel_type, valid_from)
);

-- Uploads table with station context
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    blob_url TEXT,
    status upload_status DEFAULT 'processing',
    error_message TEXT,
    ocr_data JSONB,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- OCR readings table (normalized nozzle data)
CREATE TABLE ocr_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_id UUID REFERENCES uploads(id) ON DELETE SET NULL,
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    pump_id UUID NOT NULL REFERENCES pumps(id) ON DELETE CASCADE,
    nozzle_id INTEGER NOT NULL,
    pump_sno TEXT NOT NULL, -- For reference
    fuel_type fuel_type NOT NULL,
    cumulative_volume DECIMAL(12,3) NOT NULL CHECK (cumulative_volume >= 0),
    reading_date DATE NOT NULL,
    reading_time TIME,
    is_manual_entry BOOLEAN DEFAULT false,
    entered_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevent duplicate readings
    UNIQUE(station_id, pump_sno, nozzle_id, reading_date, reading_time),
    
    -- Foreign key to nozzles for validation
    FOREIGN KEY (pump_id, nozzle_id) REFERENCES nozzles(pump_id, nozzle_id)
);

-- Sales table (calculated from readings)
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    pump_id UUID NOT NULL REFERENCES pumps(id) ON DELETE CASCADE,
    nozzle_id INTEGER NOT NULL,
    reading_id UUID NOT NULL REFERENCES ocr_readings(id) ON DELETE CASCADE,
    previous_reading_id UUID REFERENCES ocr_readings(id),
    fuel_type fuel_type NOT NULL,
    litres_sold DECIMAL(10,3) NOT NULL CHECK (litres_sold >= 0),
    price_per_litre DECIMAL(8,2) NOT NULL CHECK (price_per_litre > 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    sale_date DATE NOT NULL,
    shift shift_type NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure sales calculations are consistent
    CONSTRAINT chk_sales_calculation CHECK (
        total_amount = ROUND(litres_sold * price_per_litre, 2)
    )
);

-- Create comprehensive indexes for performance
CREATE INDEX idx_stations_active ON stations(is_active);
CREATE INDEX idx_users_station_role ON users(station_id, role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_pumps_station_sno ON pumps(station_id, pump_sno);
CREATE INDEX idx_pumps_status ON pumps(status);
CREATE INDEX idx_nozzles_pump_fuel ON nozzles(pump_id, fuel_type);
CREATE INDEX idx_fuel_prices_station_type ON fuel_prices(station_id, fuel_type, valid_from DESC);
CREATE INDEX idx_uploads_station_status ON uploads(station_id, status, created_at DESC);
CREATE INDEX idx_ocr_readings_station_date ON ocr_readings(station_id, reading_date DESC);
CREATE INDEX idx_ocr_readings_pump_nozzle ON ocr_readings(pump_sno, nozzle_id, reading_date DESC);
CREATE INDEX idx_sales_station_date ON sales(station_id, sale_date DESC);
CREATE INDEX idx_sales_pump_shift ON sales(pump_id, shift, sale_date DESC);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stations_updated_at BEFORE UPDATE ON stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pumps_updated_at BEFORE UPDATE ON pumps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nozzles_updated_at BEFORE UPDATE ON nozzles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_uploads_updated_at BEFORE UPDATE ON uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE VIEW station_summary AS
SELECT 
    s.id,
    s.name,
    s.location,
    COUNT(DISTINCT p.id) as total_pumps,
    COUNT(DISTINCT n.id) as total_nozzles,
    COUNT(DISTINCT u.id) FILTER (WHERE u.role = 'employee') as total_employees,
    COALESCE(SUM(sal.total_amount), 0) as today_revenue,
    COALESCE(SUM(sal.litres_sold), 0) as today_litres
FROM stations s
LEFT JOIN pumps p ON s.id = p.station_id AND p.status = 'active'
LEFT JOIN nozzles n ON p.id = n.pump_id AND n.status = 'active'
LEFT JOIN users u ON s.id = u.station_id AND u.is_active = true
LEFT JOIN sales sal ON s.id = sal.station_id AND sal.sale_date = CURRENT_DATE
WHERE s.is_active = true
GROUP BY s.id, s.name, s.location;

CREATE VIEW pump_performance AS
SELECT 
    p.id,
    p.station_id,
    p.pump_sno,
    p.name,
    p.status,
    COUNT(DISTINCT sal.id) as total_sales_today,
    COALESCE(SUM(sal.total_amount), 0) as revenue_today,
    COALESCE(SUM(sal.litres_sold), 0) as litres_today,
    COUNT(DISTINCT n.id) as active_nozzles
FROM pumps p
LEFT JOIN nozzles n ON p.id = n.pump_id AND n.status = 'active'
LEFT JOIN sales sal ON p.id = sal.pump_id AND sal.sale_date = CURRENT_DATE
GROUP BY p.id, p.station_id, p.pump_sno, p.name, p.status;
