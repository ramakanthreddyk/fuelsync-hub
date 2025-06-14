
-- Ensure 'sales' table includes timestamped entries
ALTER TABLE sales 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Ensure 'tender_entries' table includes timestamped entries
ALTER TABLE tender_entries 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Ensure 'daily_closure' table includes timestamped entries for status changes
ALTER TABLE daily_closure 
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ DEFAULT now();

-- Add 'fuel_prices' table if it does not exist, including date-wise pricing
CREATE TABLE IF NOT EXISTS fuel_prices (
  id SERIAL PRIMARY KEY,
  station_id INT REFERENCES stations(id),
  fuel_type fuel_type NOT NULL,
  price_per_litre NUMERIC(8,3) NOT NULL,
  valid_from TIMESTAMPTZ DEFAULT now(),
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index to speed up aggregation on sales entry_date and station_id
CREATE INDEX IF NOT EXISTS idx_sales_station_entry_date 
  ON sales(station_id, created_at);

