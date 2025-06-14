
-- Rollback Migration for Baseline Schema
-- This file provides the commands to rollback the baseline migration if needed

-- Drop triggers first
DROP TRIGGER IF EXISTS log_plan_changes ON stations;
DROP TRIGGER IF EXISTS update_nozzles_updated_at ON nozzles;
DROP TRIGGER IF EXISTS update_pumps_updated_at ON pumps;
DROP TRIGGER IF EXISTS update_stations_updated_at ON stations;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop functions
DROP FUNCTION IF EXISTS log_station_plan_change();
DROP FUNCTION IF EXISTS increment_ocr_usage(integer, date);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_fuel_prices_station_fuel;
DROP INDEX IF EXISTS idx_tender_entries_station_date;
DROP INDEX IF EXISTS idx_sales_station_date;
DROP INDEX IF EXISTS idx_ocr_readings_nozzle_date;
DROP INDEX IF EXISTS idx_ocr_readings_station_date;
DROP INDEX IF EXISTS idx_nozzles_pump;
DROP INDEX IF EXISTS idx_pumps_station;
DROP INDEX IF EXISTS idx_stations_owner;
DROP INDEX IF EXISTS idx_user_stations_station_id;
DROP INDEX IF EXISTS idx_user_stations_user_id;
DROP INDEX IF EXISTS idx_users_role;
DROP INDEX IF EXISTS idx_users_email;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS current_station_plans CASCADE;
DROP TABLE IF EXISTS nozzle_assignments CASCADE;
DROP TABLE IF EXISTS pump_assignments CASCADE;
DROP TABLE IF EXISTS tank_refills CASCADE;
DROP TABLE IF EXISTS tank_inventory CASCADE;
DROP TABLE IF EXISTS event_log CASCADE;
DROP TABLE IF EXISTS plan_usage CASCADE;
DROP TABLE IF EXISTS daily_closure CASCADE;
DROP TABLE IF EXISTS tender_entries CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS fuel_prices CASCADE;
DROP TABLE IF EXISTS ocr_readings CASCADE;
DROP TABLE IF EXISTS nozzles CASCADE;
DROP TABLE IF EXISTS pumps CASCADE;
DROP TABLE IF EXISTS station_plans CASCADE;
DROP TABLE IF EXISTS user_stations CASCADE;
DROP TABLE IF EXISTS stations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS tender_type CASCADE;
DROP TYPE IF EXISTS ocr_source CASCADE;
DROP TYPE IF EXISTS fuel_type CASCADE;
DROP TYPE IF EXISTS fuel_brand CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
