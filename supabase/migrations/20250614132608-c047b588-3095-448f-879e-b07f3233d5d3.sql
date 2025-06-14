
-- 5. Add 2 employees for each Manoj station, and map them in user_stations (skip if already exists)

-- For Fuelsync Alpha
WITH alpha_station AS (
  SELECT id AS station_id FROM stations WHERE name = 'Fuelsync Alpha'
), new_emp AS (
  INSERT INTO users (name, email, password, role, is_active)
  SELECT 'Alpha Emp 1', 'alpha.emp1@fuelsync.com', 'password', 'employee', TRUE
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'alpha.emp1@fuelsync.com')
  RETURNING id
)
INSERT INTO user_stations (user_id, station_id)
SELECT new_emp.id, alpha_station.station_id
FROM new_emp, alpha_station
WHERE NOT EXISTS (SELECT 1 FROM user_stations WHERE user_id = new_emp.id AND station_id = alpha_station.station_id);

WITH alpha_station AS (
  SELECT id AS station_id FROM stations WHERE name = 'Fuelsync Alpha'
), new_emp AS (
  INSERT INTO users (name, email, password, role, is_active)
  SELECT 'Alpha Emp 2', 'alpha.emp2@fuelsync.com', 'password', 'employee', TRUE
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'alpha.emp2@fuelsync.com')
  RETURNING id
)
INSERT INTO user_stations (user_id, station_id)
SELECT new_emp.id, alpha_station.station_id
FROM new_emp, alpha_station
WHERE NOT EXISTS (SELECT 1 FROM user_stations WHERE user_id = new_emp.id AND station_id = alpha_station.station_id);

-- For Fuelsync Beta
WITH beta_station AS (
  SELECT id AS station_id FROM stations WHERE name = 'Fuelsync Beta'
), new_emp AS (
  INSERT INTO users (name, email, password, role, is_active)
  SELECT 'Beta Emp 1', 'beta.emp1@fuelsync.com', 'password', 'employee', TRUE
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'beta.emp1@fuelsync.com')
  RETURNING id
)
INSERT INTO user_stations (user_id, station_id)
SELECT new_emp.id, beta_station.station_id
FROM new_emp, beta_station
WHERE NOT EXISTS (SELECT 1 FROM user_stations WHERE user_id = new_emp.id AND station_id = beta_station.station_id);

WITH beta_station AS (
  SELECT id AS station_id FROM stations WHERE name = 'Fuelsync Beta'
), new_emp AS (
  INSERT INTO users (name, email, password, role, is_active)
  SELECT 'Beta Emp 2', 'beta.emp2@fuelsync.com', 'password', 'employee', TRUE
  WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'beta.emp2@fuelsync.com')
  RETURNING id
)
INSERT INTO user_stations (user_id, station_id)
SELECT new_emp.id, beta_station.station_id
FROM new_emp, beta_station
WHERE NOT EXISTS (SELECT 1 FROM user_stations WHERE user_id = new_emp.id AND station_id = beta_station.station_id);
