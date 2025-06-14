
-- 1. Seed FUEL PRICES for both stations and for PETROL/DIESEL (if not already seeded)

INSERT INTO fuel_prices (station_id, fuel_type, price_per_litre, valid_from, created_by)
SELECT s.id, 'PETROL'::fuel_type, 108.95, now(), u.id
FROM stations s, users u
WHERE s.name = 'Fuelsync Alpha'
  AND u.email = 'manojreddy@fuelsync.com'
  AND NOT EXISTS (
    SELECT 1 FROM fuel_prices WHERE station_id = s.id AND fuel_type = 'PETROL'
  );

INSERT INTO fuel_prices (station_id, fuel_type, price_per_litre, valid_from, created_by)
SELECT s.id, 'DIESEL'::fuel_type, 92.45, now(), u.id
FROM stations s, users u
WHERE s.name = 'Fuelsync Alpha'
  AND u.email = 'manojreddy@fuelsync.com'
  AND NOT EXISTS (
    SELECT 1 FROM fuel_prices WHERE station_id = s.id AND fuel_type = 'DIESEL'
  );

INSERT INTO fuel_prices (station_id, fuel_type, price_per_litre, valid_from, created_by)
SELECT s.id, 'PETROL'::fuel_type, 113.15, now(), u.id
FROM stations s, users u
WHERE s.name = 'Fuelsync Beta'
  AND u.email = 'manojreddy@fuelsync.com'
  AND NOT EXISTS (
    SELECT 1 FROM fuel_prices WHERE station_id = s.id AND fuel_type = 'PETROL'
  );

INSERT INTO fuel_prices (station_id, fuel_type, price_per_litre, valid_from, created_by)
SELECT s.id, 'DIESEL'::fuel_type, 96.25, now(), u.id
FROM stations s, users u
WHERE s.name = 'Fuelsync Beta'
  AND u.email = 'manojreddy@fuelsync.com'
  AND NOT EXISTS (
    SELECT 1 FROM fuel_prices WHERE station_id = s.id AND fuel_type = 'DIESEL'
  );

-- 2. Seed a couple of OCR_READINGS and corresponding SALES for Alpha station, P1 nozzle 1 and 2 (assuming pump_sno exists)

DO $$
DECLARE
  alpha_station_id INTEGER;
  nozzle1_id INTEGER;
  nozzle2_id INTEGER;
  employee_id INTEGER;
  reading_id1 INTEGER;
  reading_id2 INTEGER;
BEGIN
  SELECT id INTO alpha_station_id FROM stations WHERE name = 'Fuelsync Alpha';
  SELECT n.id INTO nozzle1_id FROM nozzles n JOIN pumps p ON n.pump_id = p.id WHERE p.station_id = alpha_station_id AND p.pump_sno = 'P1' AND n.nozzle_number = 1;
  SELECT n.id INTO nozzle2_id FROM nozzles n JOIN pumps p ON n.pump_id = p.id WHERE p.station_id = alpha_station_id AND p.pump_sno = 'P1' AND n.nozzle_number = 2;
  SELECT id INTO employee_id FROM users WHERE email = 'alpha.emp1@fuelsync.com';

  -- Insert OCR readings for nozzle 1 (two readings, to generate a sale)
  INSERT INTO ocr_readings(station_id, nozzle_id, pump_sno, source, reading_date, reading_time, cumulative_vol, created_by)
  VALUES (alpha_station_id, nozzle1_id, 'P1', 'ocr', CURRENT_DATE - INTERVAL '1 DAY', '07:00', 1000, employee_id)
  RETURNING id INTO reading_id1;
  INSERT INTO ocr_readings(station_id, nozzle_id, pump_sno, source, reading_date, reading_time, cumulative_vol, created_by)
  VALUES (alpha_station_id, nozzle1_id, 'P1', 'ocr', CURRENT_DATE, '07:00', 1100, employee_id)
  RETURNING id INTO reading_id2;

  -- Insert SALE for these readings (delta = 100)
  INSERT INTO sales (station_id, nozzle_id, reading_id, delta_volume_l, price_per_litre, total_amount)
  SELECT alpha_station_id, nozzle1_id, reading_id2, 100, fp.price_per_litre, 100 * fp.price_per_litre
  FROM fuel_prices fp
  WHERE fp.station_id = alpha_station_id AND fp.fuel_type = 'PETROL'
  LIMIT 1;

  -- Repeat for nozzle 2, with smaller sale
  INSERT INTO ocr_readings(station_id, nozzle_id, pump_sno, source, reading_date, reading_time, cumulative_vol, created_by)
  VALUES (alpha_station_id, nozzle2_id, 'P1', 'ocr', CURRENT_DATE - INTERVAL '1 DAY', '07:00', 500, employee_id);
  INSERT INTO ocr_readings(station_id, nozzle_id, pump_sno, source, reading_date, reading_time, cumulative_vol, created_by)
  VALUES (alpha_station_id, nozzle2_id, 'P1', 'ocr', CURRENT_DATE, '07:00', 525, employee_id);

  INSERT INTO sales (station_id, nozzle_id, reading_id, delta_volume_l, price_per_litre, total_amount)
  SELECT alpha_station_id, nozzle2_id, (SELECT id FROM ocr_readings WHERE nozzle_id = nozzle2_id AND reading_date = CURRENT_DATE), 25, fp.price_per_litre, 25 * fp.price_per_litre
  FROM fuel_prices fp
  WHERE fp.station_id = alpha_station_id AND fp.fuel_type = 'PETROL'
  LIMIT 1;
END $$;

-- 3. Add Tender Entries for Alpha station for today

DO $$
DECLARE
  alpha_station_id INTEGER;
  employee_id INTEGER;
BEGIN
  SELECT id INTO alpha_station_id FROM stations WHERE name = 'Fuelsync Alpha';
  SELECT id INTO employee_id FROM users WHERE email = 'alpha.emp1@fuelsync.com';

  INSERT INTO tender_entries (station_id, entry_date, type, payer, amount, user_id)
  VALUES (alpha_station_id, CURRENT_DATE, 'cash', 'Customer A', 9000, employee_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO tender_entries (station_id, entry_date, type, payer, amount, user_id)
  VALUES (alpha_station_id, CURRENT_DATE, 'card', 'Customer B', 1200, employee_id)
  ON CONFLICT DO NOTHING;
END $$;

-- Repeat for Beta station

DO $$
DECLARE
  beta_station_id INTEGER;
  nozzle1_id INTEGER;
  nozzle2_id INTEGER;
  employee_id INTEGER;
BEGIN
  SELECT id INTO beta_station_id FROM stations WHERE name = 'Fuelsync Beta';
  SELECT n.id INTO nozzle1_id FROM nozzles n JOIN pumps p ON n.pump_id = p.id WHERE p.station_id = beta_station_id AND p.pump_sno = 'P1' AND n.nozzle_number = 1;
  SELECT n.id INTO nozzle2_id FROM nozzles n JOIN pumps p ON n.pump_id = p.id WHERE p.station_id = beta_station_id AND p.pump_sno = 'P1' AND n.nozzle_number = 2;
  SELECT id INTO employee_id FROM users WHERE email = 'beta.emp1@fuelsync.com';

  INSERT INTO ocr_readings(station_id, nozzle_id, pump_sno, source, reading_date, reading_time, cumulative_vol, created_by)
  VALUES (beta_station_id, nozzle1_id, 'P1', 'ocr', CURRENT_DATE - INTERVAL '1 DAY', '07:00', 800, employee_id);
  INSERT INTO ocr_readings(station_id, nozzle_id, pump_sno, source, reading_date, reading_time, cumulative_vol, created_by)
  VALUES (beta_station_id, nozzle1_id, 'P1', 'ocr', CURRENT_DATE, '07:00', 850, employee_id);

  INSERT INTO sales (station_id, nozzle_id, reading_id, delta_volume_l, price_per_litre, total_amount)
  SELECT beta_station_id, nozzle1_id, (SELECT id FROM ocr_readings WHERE nozzle_id = nozzle1_id AND reading_date = CURRENT_DATE), 50, fp.price_per_litre, 50 * fp.price_per_litre
  FROM fuel_prices fp
  WHERE fp.station_id = beta_station_id AND fp.fuel_type = 'PETROL'
  LIMIT 1;

  -- Tender entries
  INSERT INTO tender_entries (station_id, entry_date, type, payer, amount, user_id)
  VALUES (beta_station_id, CURRENT_DATE, 'upi', 'Customer C', 4000, employee_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO tender_entries (station_id, entry_date, type, payer, amount, user_id)
  VALUES (beta_station_id, CURRENT_DATE, 'cash', 'Customer D', 3500, employee_id)
  ON CONFLICT DO NOTHING;
END $$;
