
# FuelSync Database Schema Documentation

## Overview

The FuelSync database is designed with a multi-tenant architecture supporting fuel station management with three main user roles: Super Admins, Owners, and Employees.

## Entity Relationship Diagram

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    Plans    │    │    Users    │    │  Stations   │
│             │    │             │    │             │
│ id (PK)     │    │ id (PK)     │    │ id (PK)     │
│ name        │    │ name        │    │ name        │
│ price_monthly│   │ email       │    │ brand       │
│ features    │    │ role        │◄──┐│ address     │
│ ...         │    │ station_id  │   ││ owner_id (FK)│
└─────────────┘    │ ...         │   │└─────────────┘
                   └─────────────┘   │       │
                                    │       │
┌─────────────┐    ┌─────────────┐   │       │    ┌─────────────┐
│   Pumps     │    │  Nozzles    │   │       │    │Station_Plans│
│             │    │             │   │       │    │             │
│ id (PK)     │    │ id (PK)     │   │       └───►│ station_id  │
│ station_id  │◄───┤ pump_id (FK)│   │            │ plan_id     │
│ pump_sno    │    │ nozzle_num  │   │            │ effective_from│
│ name        │    │ fuel_type   │   │            │ ...         │
│ ...         │    │ ...         │   │            └─────────────┘
└─────────────┘    └─────────────┘   │
       │                  │          │
       │                  │          │
       ▼                  ▼          │
┌─────────────┐    ┌─────────────┐   │
│OCR_Readings │    │Fuel_Prices  │   │
│             │    │             │   │
│ id (PK)     │    │ id (PK)     │   │
│ station_id  │◄───┼─station_id  │◄──┘
│ nozzle_id   │    │ fuel_type   │
│ pump_sno    │    │ price_per_l │
│ reading_date│    │ valid_from  │
│ cumulative_vol│  │ ...         │
│ source      │    └─────────────┘
│ ocr_json    │
│ ...         │
└─────────────┘
       │
       ▼
┌─────────────┐
│    Sales    │
│             │
│ id (PK)     │
│ station_id  │
│ nozzle_id   │
│ reading_id  │
│ delta_vol_l │
│ total_amount│
│ ...         │
└─────────────┘
```

## Core Tables

### 1. Users
Stores all system users with role-based access.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password TEXT NOT NULL,
  role user_role NOT NULL, -- 'superadmin', 'owner', 'employee'
  station_id INT REFERENCES stations(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Relationships:**
- `station_id`: Only populated for employees (references their assigned station)
- Owners have `station_id = NULL` and own stations via `stations.owner_id`

### 2. Stations
Fuel stations owned by users with owner role.

```sql
CREATE TABLE stations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  brand station_brand NOT NULL, -- 'IOCL', 'BPCL', 'HPCL'
  address TEXT,
  owner_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_plan_id INT REFERENCES plans(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key Relationships:**
- `owner_id`: References `users.id` where `role = 'owner'`
- One owner can have multiple stations
- Each station belongs to exactly one owner

### 3. Plans
Subscription plans that define feature limits.

```sql
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
```

**Default Plans:**
- **Free**: ₹0/month, 2 pumps, 4 nozzles, 2 employees, 10 OCR/month
- **Basic**: ₹999/month, 5 pumps, 10 nozzles, 5 employees, 50 OCR/month
- **Premium**: ₹2999/month, 20 pumps, 50 nozzles, 20 employees, 200 OCR/month

### 4. Station_Plans
Tracks subscription history for stations.

```sql
CREATE TABLE station_plans (
  station_id INT REFERENCES stations(id) ON DELETE CASCADE,
  plan_id INT REFERENCES plans(id),
  effective_from TIMESTAMPTZ NOT NULL,
  effective_to TIMESTAMPTZ,
  is_paid BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (station_id, effective_from)
);
```

### 5. Pumps
Fuel dispensers at each station.

```sql
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
```

### 6. Nozzles
Individual fuel nozzles on each pump.

```sql
CREATE TABLE nozzles (
  id SERIAL PRIMARY KEY,
  pump_id INT NOT NULL REFERENCES pumps(id) ON DELETE CASCADE,
  nozzle_number INT NOT NULL,
  fuel_type fuel_type NOT NULL, -- 'PETROL', 'DIESEL', 'CNG', 'EV'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (pump_id, nozzle_number)
);
```

### 7. OCR_Readings (Updated Schema)
Fuel meter readings captured via OCR or manual entry.

```sql
CREATE TABLE ocr_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id INT NOT NULL REFERENCES stations(id),
  nozzle_id INT NOT NULL REFERENCES nozzles(id),
  pump_sno TEXT NOT NULL,
  reading_date DATE NOT NULL,
  reading_time TIME NOT NULL,
  cumulative_vol NUMERIC(12,2) NOT NULL,
  source TEXT DEFAULT 'ocr' CHECK (source IN ('ocr', 'manual')),
  ocr_json JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (nozzle_id, reading_date, reading_time)
);
```

**Key Changes:**
- Removed `fuel_type`, `litres_sold`, `price_per_litre`, `total_amount`, `cum_sale` columns
- Added `pump_sno` for reference and validation
- Added `source` to distinguish between 'ocr' and 'manual' entries
- Added `ocr_json` to store raw OCR processing results
- Changed `id` to UUID type

### 8. Fuel_Prices
Current fuel pricing at each station.

```sql
CREATE TABLE fuel_prices (
  id SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(id),
  fuel_type fuel_type NOT NULL,
  price_per_litre NUMERIC(8,3) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 9. Sales
Calculated sales data based on reading differences.

```sql
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
```

### 10. Tender_Entries
Cash/card collections and payments.

```sql
CREATE TABLE tender_entries (
  id SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(id),
  entry_date DATE NOT NULL,
  type tender_type, -- 'cash', 'card', 'upi', 'credit'
  payer TEXT,
  amount NUMERIC(14,2) CHECK (amount >= 0),
  user_id INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 11. Daily_Closure
End-of-day reconciliation.

```sql
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
```

### 12. Plan_Usage
Monthly usage tracking for plan limits.

```sql
CREATE TABLE plan_usage (
  station_id INT REFERENCES stations(id),
  month DATE,
  ocr_count INT DEFAULT 0,
  pumps_used INT DEFAULT 0,
  nozzles_used INT DEFAULT 0,
  employees_count INT DEFAULT 0,
  PRIMARY KEY (station_id, month)
);
```

## Custom Types (Enums)

```sql
CREATE TYPE user_role AS ENUM ('superadmin', 'owner', 'employee');
CREATE TYPE station_brand AS ENUM ('IOCL', 'BPCL', 'HPCL');
CREATE TYPE fuel_type AS ENUM ('PETROL', 'DIESEL', 'CNG', 'EV');
CREATE TYPE reading_source AS ENUM ('ocr', 'manual');
CREATE TYPE tender_type AS ENUM ('cash', 'card', 'upi', 'credit');
```

## API Endpoints

### OCR Upload API
**Endpoint:** `POST /functions/v1/ocr-upload`
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `file`: Image file (required)
  - `pump_sno`: Pump serial number override (optional)
- **Response:** JSON with OCR results and inserted readings count

### Manual Reading API
**Endpoint:** `POST /functions/v1/manual-reading`
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "station_id": 1,
    "nozzle_id": 1,
    "cumulative_vol": 12345.678,
    "reading_date": "2023-12-15",
    "reading_time": "14:30"
  }
  ```
- **Response:** JSON with success status and saved reading data

## Business Rules & Constraints

### User Role Constraints
1. **Superadmin**: No station_id (system-wide access)
2. **Owner**: No station_id (owns stations via stations.owner_id)
3. **Employee**: Must have station_id (tied to specific station)

### Data Access Rules
1. **Superadmin**: Access to all data
2. **Owner**: Access only to owned stations and their data
3. **Employee**: Access only to assigned station data

### OCR vs Manual Reading Flow
1. **OCR Flow**: Image → Azure OCR → Parse nozzle readings → Insert multiple records
2. **Manual Flow**: Form input → Validate → Insert single record
3. **Both flows** populate the same `ocr_readings` table with appropriate `source` value

### Referential Integrity
- Stations must have valid owner (owner role user)
- Employees must be assigned to valid station
- OCR readings must reference valid station and nozzle
- Sales calculations based on reading deltas

## Indexes for Performance

```sql
-- User access patterns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_station_id ON users(station_id);
CREATE INDEX idx_users_role_station ON users(role, station_id);

-- Station ownership
CREATE INDEX idx_stations_owner ON stations(owner_id);

-- Data filtering by station
CREATE INDEX idx_pumps_station ON pumps(station_id);
CREATE INDEX idx_nozzles_pump ON nozzles(pump_id);
CREATE INDEX idx_ocr_readings_station_date ON ocr_readings(station_id, reading_date);
CREATE INDEX idx_ocr_readings_nozzle_date ON ocr_readings(nozzle_id, reading_date);
CREATE INDEX idx_ocr_readings_pump_sno ON ocr_readings(pump_sno);
CREATE INDEX idx_ocr_readings_source ON ocr_readings(source);
CREATE INDEX idx_sales_station_date ON sales(station_id, created_at);
CREATE INDEX idx_tender_entries_station_date ON tender_entries(station_id, entry_date);
CREATE INDEX idx_fuel_prices_station_fuel ON fuel_prices(station_id, fuel_type, valid_from);
```

This schema supports the complete multi-tenant fuel station management system with proper data isolation, role-based access control, and dual OCR/manual reading capabilities.
