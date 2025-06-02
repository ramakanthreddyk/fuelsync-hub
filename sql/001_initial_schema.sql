
-- FuelSync Database Schema
-- Initial migration script

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Plans table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(20) NOT NULL UNIQUE CHECK (name IN ('Free', 'Basic', 'Premium')),
    upload_limit INTEGER NOT NULL COMMENT 'Daily upload limit (-1 for unlimited)',
    features JSONB NOT NULL DEFAULT '{}',
    price DECIMAL(8,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'Employee' CHECK (role IN ('Super Admin', 'Pump Owner', 'Manager', 'Employee')),
    station_id UUID,
    plan_id UUID REFERENCES plans(id),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pumps table
CREATE TABLE pumps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    station_id UUID,
    last_maintenance_date DATE,
    total_sales_today DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Nozzles table
CREATE TABLE nozzles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pump_id UUID NOT NULL REFERENCES pumps(id) ON DELETE CASCADE,
    number INTEGER NOT NULL CHECK (number >= 1 AND number <= 10),
    fuel_type VARCHAR(10) NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(pump_id, number)
);

-- Uploads table
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    blob_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'success', 'failed')),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    litres DECIMAL(8,3) NOT NULL DEFAULT 0,
    fuel_type VARCHAR(10) NOT NULL DEFAULT 'Petrol' CHECK (fuel_type IN ('Petrol', 'Diesel')),
    processed_at TIMESTAMP WITH TIME ZONE,
    ocr_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pump_id UUID NOT NULL REFERENCES pumps(id) ON DELETE CASCADE,
    fuel_type VARCHAR(10) NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel')),
    litres DECIMAL(8,3) NOT NULL,
    price_per_litre DECIMAL(8,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    shift VARCHAR(20) NOT NULL CHECK (shift IN ('morning', 'afternoon', 'night')),
    upload_id UUID REFERENCES uploads(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fuel prices table
CREATE TABLE fuel_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fuel_type VARCHAR(10) NOT NULL UNIQUE CHECK (fuel_type IN ('Petrol', 'Diesel')),
    price DECIMAL(8,2) NOT NULL CHECK (price > 0),
    updated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_uploads_status ON uploads(status);
CREATE INDEX idx_uploads_created_at ON uploads(created_at);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_pump_id ON sales(pump_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_sales_fuel_type ON sales(fuel_type);
CREATE INDEX idx_nozzles_pump_id ON nozzles(pump_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pumps_updated_at BEFORE UPDATE ON pumps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nozzles_updated_at BEFORE UPDATE ON nozzles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uploads_updated_at BEFORE UPDATE ON uploads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_prices_updated_at BEFORE UPDATE ON fuel_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
