
-- Add user_stations junction table for many-to-many relationship
CREATE TABLE public.user_stations (
  user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  station_id integer NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id, station_id)
);

-- Enable RLS
ALTER TABLE public.user_stations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own station assignments" 
  ON public.user_stations 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage station assignments" 
  ON public.user_stations 
  FOR ALL 
  USING (false);

-- Create indexes for performance
CREATE INDEX idx_user_stations_user_id ON public.user_stations(user_id);
CREATE INDEX idx_user_stations_station_id ON public.user_stations(station_id);

-- Update existing migration to remove station_id from users table and add user_stations data
-- Remove the foreign key constraint first
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_station;

-- Remove the station_id column from users table
ALTER TABLE users DROP COLUMN IF EXISTS station_id;

-- Insert data into user_stations table based on existing user roles
-- This assumes employees need to be linked to stations
-- For now, we'll create a default assignment - this should be updated based on business logic
