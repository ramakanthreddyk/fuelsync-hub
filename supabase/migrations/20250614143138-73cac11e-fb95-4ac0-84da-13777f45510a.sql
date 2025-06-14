
-- 1. Add (or replace) a unique constraint to de-duplicate readings
ALTER TABLE ocr_readings
ADD CONSTRAINT unique_nozzle_datetime UNIQUE (
  station_id,
  pump_sno,
  nozzle_id,
  reading_date,
  reading_time
);

-- 2. Drop the uploads table (since it's no longer needed)
DROP TABLE IF EXISTS uploads CASCADE;
