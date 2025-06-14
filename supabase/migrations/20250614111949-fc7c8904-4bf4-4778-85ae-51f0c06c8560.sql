
-- 1. Create table for user activity logging
CREATE TABLE public.user_activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  station_id INTEGER REFERENCES stations(id),
  activity_type TEXT NOT NULL,
  details JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Fast querying: index for user-based query
CREATE INDEX idx_user_activity_user_id ON user_activity_log(user_id);

-- 3. Fast querying: index for station-based query
CREATE INDEX idx_user_activity_station_id ON user_activity_log(station_id);

-- 4. Fast querying: index for activity_type queries
CREATE INDEX idx_user_activity_type ON user_activity_log(activity_type);

-- 5. (Optional best practice: depending on your policies, add RLS and policies)
-- ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
-- (Add RLS policies here if users should only view their own logs.)

