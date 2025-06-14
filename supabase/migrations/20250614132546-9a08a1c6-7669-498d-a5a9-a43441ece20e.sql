
-- 3. Insert two pumps per station (if not already present)
INSERT INTO pumps (station_id, pump_sno, name, is_active)
SELECT s.id, 'P1', 'Pump 1', TRUE
FROM stations s WHERE s.name = 'Fuelsync Alpha'
AND NOT EXISTS (SELECT 1 FROM pumps WHERE station_id = s.id AND pump_sno = 'P1');

INSERT INTO pumps (station_id, pump_sno, name, is_active)
SELECT s.id, 'P2', 'Pump 2', TRUE
FROM stations s WHERE s.name = 'Fuelsync Alpha'
AND NOT EXISTS (SELECT 1 FROM pumps WHERE station_id = s.id AND pump_sno = 'P2');

INSERT INTO pumps (station_id, pump_sno, name, is_active)
SELECT s.id, 'P1', 'Pump 1', TRUE
FROM stations s WHERE s.name = 'Fuelsync Beta'
AND NOT EXISTS (SELECT 1 FROM pumps WHERE station_id = s.id AND pump_sno = 'P1');

INSERT INTO pumps (station_id, pump_sno, name, is_active)
SELECT s.id, 'P2', 'Pump 2', TRUE
FROM stations s WHERE s.name = 'Fuelsync Beta'
AND NOT EXISTS (SELECT 1 FROM pumps WHERE station_id = s.id AND pump_sno = 'P2');

-- 4. Insert four nozzles per pump (if not already present: 1,2=PETROL, 3,4=DIESEL)
DO $$
DECLARE
  pump_rec RECORD;
  cnt INTEGER;
BEGIN
  FOR pump_rec IN SELECT id FROM pumps WHERE pump_sno IN ('P1','P2') AND station_id IN (SELECT id FROM stations WHERE name IN ('Fuelsync Alpha','Fuelsync Beta')) LOOP
    FOR cnt IN 1..4 LOOP
      IF NOT EXISTS (
          SELECT 1 FROM nozzles WHERE pump_id = pump_rec.id AND nozzle_number = cnt
      ) THEN
        INSERT INTO nozzles (pump_id, nozzle_number, fuel_type, is_active)
        VALUES (
          pump_rec.id,
          cnt,
          CASE WHEN cnt IN (1,2) THEN 'PETROL'::fuel_type ELSE 'DIESEL'::fuel_type END,
          TRUE
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;
