
-- Add station_id to ocr_readings if missing
ALTER TABLE ocr_readings
  ADD COLUMN IF NOT EXISTS station_id INTEGER;

-- Add a foreign key constraint to ocr_readings.station_id → stations.id
DO $$
BEGIN
  -- Only add if not already present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'ocr_readings'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'ocr_readings_station_id_fkey'
  ) THEN
    ALTER TABLE ocr_readings
      ADD CONSTRAINT ocr_readings_station_id_fkey
      FOREIGN KEY (station_id) REFERENCES stations(id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- Make station_id NOT NULL on ocr_readings if possible
-- (Skip this if you have legacy rows and want to migrate them yourself)
-- ALTER TABLE ocr_readings ALTER COLUMN station_id SET NOT NULL;

-- Add station_id to fuel_prices if missing
ALTER TABLE fuel_prices
  ADD COLUMN IF NOT EXISTS station_id INTEGER;

-- Add a foreign key constraint to fuel_prices.station_id → stations.id
DO $$
BEGIN
  -- Only add if not already present
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'fuel_prices'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'fuel_prices_station_id_fkey'
  ) THEN
    ALTER TABLE fuel_prices
      ADD CONSTRAINT fuel_prices_station_id_fkey
      FOREIGN KEY (station_id) REFERENCES stations(id)
      ON DELETE CASCADE;
  END IF;
END$$;

-- Make station_id NOT NULL on fuel_prices if possible
-- (Skip this if you have legacy rows and want to migrate them yourself)
-- ALTER TABLE fuel_prices ALTER COLUMN station_id SET NOT NULL;
