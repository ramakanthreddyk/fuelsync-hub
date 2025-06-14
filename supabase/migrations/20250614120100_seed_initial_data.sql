
-- Seed Initial Data Migration
-- This migration adds the initial required data for the system

-- Insert sample plans
INSERT INTO plans (name, price_monthly, max_pumps, max_nozzles, max_employees, max_ocr_monthly, allow_manual_entry, edit_fuel_type, export_reports, features) VALUES
('Free', 0, 2, 4, 2, 10, TRUE, FALSE, FALSE, '{"basic_reports": true}'::jsonb),
('Basic', 999, 5, 10, 5, 50, TRUE, TRUE, TRUE, '{"basic_reports": true, "analytics": true}'::jsonb),
('Premium', 2999, 20, 50, 20, 200, TRUE, TRUE, TRUE, '{"basic_reports": true, "analytics": true, "advanced_reports": true, "api_access": true}'::jsonb);

-- Insert sample superadmin user (password: admin123)
-- Hash: $2a$12$LQv3c1yqBwEHJ/OKL2XfOOHyFaFDK8K8Y0XQNOXwpx7LfGMGzV/ta
INSERT INTO users (name, email, phone, password, role, is_active) VALUES
('Super Admin', 'admin@mygas.com', '+91-9999999999', '$2a$12$LQv3c1yqBwEHJ/OKL2XfOOHyFaFDK8K8Y0XQNOXwpx7LfGMGzV/ta', 'superadmin', TRUE);

-- Insert sample owner and employee users for testing
INSERT INTO users (name, email, phone, password, role, is_active) VALUES
('Station Owner', 'owner@fuelsync.com', '+91-9876543210', '$2a$12$LQv3c1yqBwEHJ/OKL2XfOOHyFaFDK8K8Y0XQNOXwpx7LfGMGzV/ta', 'owner', TRUE),
('Station Manager', 'manager@fuelsync.com', '+91-9876543211', '$2a$12$LQv3c1yqBwEHJ/OKL2XfOOHyFaFDK8K8Y0XQNOXwpx7LfGMGzV/ta', 'employee', TRUE),
('Station Employee', 'employee@fuelsync.com', '+91-9876543212', '$2a$12$LQv3c1yqBwEHJ/OKL2XfOOHyFaFDK8K8Y0XQNOXwpx7LfGMGzV/ta', 'employee', TRUE);

-- Insert sample stations
INSERT INTO stations (name, brand, address, owner_id, current_plan_id, plan_id, is_active) VALUES
('Sunrise Fuel Station', 'IOCL', '123 Main Street, Mumbai, Maharashtra 400001', 
 (SELECT id FROM users WHERE email = 'owner@fuelsync.com'), 
 (SELECT id FROM plans WHERE name = 'Basic'),
 (SELECT id FROM plans WHERE name = 'Basic'), 
 TRUE),
('Highway Express', 'BPCL', '456 Highway Road, Delhi, Delhi 110001', 
 (SELECT id FROM users WHERE email = 'owner@fuelsync.com'), 
 (SELECT id FROM plans WHERE name = 'Premium'),
 (SELECT id FROM plans WHERE name = 'Premium'), 
 TRUE);

-- Link users to stations
INSERT INTO user_stations (user_id, station_id)
SELECT u.id, s.id 
FROM users u, stations s 
WHERE u.email IN ('owner@fuelsync.com', 'manager@fuelsync.com', 'employee@fuelsync.com')
AND s.name = 'Sunrise Fuel Station';

-- Insert sample pumps for the first station
INSERT INTO pumps (station_id, pump_sno, name, is_active) VALUES
((SELECT id FROM stations WHERE name = 'Sunrise Fuel Station'), 'P001', 'Pump 1', TRUE),
((SELECT id FROM stations WHERE name = 'Sunrise Fuel Station'), 'P002', 'Pump 2', TRUE),
((SELECT id FROM stations WHERE name = 'Highway Express'), 'P001', 'Pump 1', TRUE),
((SELECT id FROM stations WHERE name = 'Highway Express'), 'P002', 'Pump 2', TRUE);

-- Insert nozzles for each pump
INSERT INTO nozzles (pump_id, nozzle_number, fuel_type, is_active)
SELECT p.id, n.nozzle_number, 
       CASE WHEN n.nozzle_number <= 2 THEN 'PETROL'::fuel_type ELSE 'DIESEL'::fuel_type END,
       TRUE
FROM pumps p
CROSS JOIN (
    SELECT 1 as nozzle_number UNION ALL
    SELECT 2 UNION ALL
    SELECT 3 UNION ALL
    SELECT 4
) n;

-- Insert initial fuel prices
INSERT INTO fuel_prices (station_id, fuel_type, price_per_litre, created_by) VALUES
((SELECT id FROM stations WHERE name = 'Sunrise Fuel Station'), 'PETROL', 105.50, (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1)),
((SELECT id FROM stations WHERE name = 'Sunrise Fuel Station'), 'DIESEL', 92.30, (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1)),
((SELECT id FROM stations WHERE name = 'Highway Express'), 'PETROL', 106.00, (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1)),
((SELECT id FROM stations WHERE name = 'Highway Express'), 'DIESEL', 93.00, (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1));

-- Initialize tank inventory
INSERT INTO tank_inventory (station_id, fuel_type, current_level_l) VALUES
((SELECT id FROM stations WHERE name = 'Sunrise Fuel Station'), 'PETROL', 15000),
((SELECT id FROM stations WHERE name = 'Sunrise Fuel Station'), 'DIESEL', 12000),
((SELECT id FROM stations WHERE name = 'Highway Express'), 'PETROL', 18000),
((SELECT id FROM stations WHERE name = 'Highway Express'), 'DIESEL', 14000);
