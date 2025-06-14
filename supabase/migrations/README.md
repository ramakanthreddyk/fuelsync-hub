
# FuelSync Database Migrations

This directory contains the SQL migration files for the FuelSync application database.

## Migration Files

### Baseline Migration
- **20250614120000_baseline_schema.sql** - Complete database schema including all tables, indexes, triggers, and functions
- **20250614120100_seed_initial_data.sql** - Initial seed data including plans, users, stations, and sample data
- **20250614120200_rollback_baseline.sql** - Rollback commands for the baseline migration

## Migration Order

1. Run `20250614120000_baseline_schema.sql` to create the complete schema
2. Run `20250614120100_seed_initial_data.sql` to populate initial data
3. Future incremental migrations should be added with timestamps after these baseline migrations

## Schema Overview

### Core Tables
- **plans** - Subscription plans (Free, Basic, Premium)
- **users** - System users with roles (superadmin, owner, employee)
- **stations** - Fuel stations with branding and ownership
- **user_stations** - Many-to-many relationship between users and stations

### Operational Tables
- **pumps** - Fuel pumps at stations
- **nozzles** - Individual nozzles on pumps
- **ocr_readings** - Fuel meter readings (OCR or manual)
- **sales** - Calculated sales data from readings
- **fuel_prices** - Current fuel pricing per station
- **tender_entries** - Cash/card/payment entries

### Administrative Tables
- **daily_closure** - Daily reconciliation data
- **plan_usage** - Usage tracking for plan limits
- **event_log** - System event logging
- **tank_inventory** - Fuel tank levels
- **tank_refills** - Tank refill records

## Custom Types
- **user_role** - ('superadmin', 'owner', 'employee')
- **fuel_brand** - ('IOCL', 'BPCL', 'HPCL')
- **fuel_type** - ('PETROL', 'DIESEL', 'CNG', 'EV')
- **ocr_source** - ('ocr', 'manual')
- **tender_type** - ('cash', 'card', 'upi', 'credit')

## Functions
- **update_updated_at_column()** - Trigger function for timestamp updates
- **increment_ocr_usage()** - Track OCR usage for plan limits
- **log_station_plan_change()** - Log plan changes automatically

## Default Credentials (for testing)
- **Super Admin**: admin@mygas.com / admin123
- **Station Owner**: owner@fuelsync.com / admin123
- **Manager**: manager@fuelsync.com / admin123
- **Employee**: employee@fuelsync.com / admin123

## Notes
- All passwords are hashed using bcrypt with salt rounds 12
- The schema includes comprehensive indexes for performance
- Row-level security policies should be added as needed
- Foreign key constraints ensure data integrity
- Triggers automatically update timestamps and log changes
