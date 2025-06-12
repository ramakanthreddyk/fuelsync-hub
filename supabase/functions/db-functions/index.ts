
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create helper functions for the application
    const functions = [
      // Function to increment OCR usage
      `
      CREATE OR REPLACE FUNCTION increment_ocr_usage(p_station_id INT, p_month DATE)
      RETURNS VOID AS $$
      BEGIN
        INSERT INTO plan_usage (station_id, month, ocr_count)
        VALUES (p_station_id, p_month, 1)
        ON CONFLICT (station_id, month)
        DO UPDATE SET ocr_count = plan_usage.ocr_count + 1;
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      // Function to get user accessible stations
      `
      CREATE OR REPLACE FUNCTION get_user_stations(p_user_id INT)
      RETURNS TABLE(station_id INT, station_name TEXT, role TEXT) AS $$
      BEGIN
        RETURN QUERY
        SELECT s.id, s.name, u.role::TEXT
        FROM stations s
        JOIN user_stations us ON s.id = us.station_id
        JOIN users u ON us.user_id = u.id
        WHERE u.id = p_user_id AND u.is_active = true;
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      // Function to check plan limits
      `
      CREATE OR REPLACE FUNCTION check_plan_limit(p_station_id INT, p_limit_type TEXT)
      RETURNS BOOLEAN AS $$
      DECLARE
        current_usage INT;
        plan_limit INT;
        current_month DATE;
      BEGIN
        current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
        
        CASE p_limit_type
          WHEN 'ocr' THEN
            SELECT COALESCE(ocr_count, 0) INTO current_usage
            FROM plan_usage 
            WHERE station_id = p_station_id AND month = current_month;
            
            SELECT p.max_ocr_monthly INTO plan_limit
            FROM stations s
            JOIN plans p ON s.current_plan_id = p.id
            WHERE s.id = p_station_id;
            
            RETURN COALESCE(current_usage, 0) < COALESCE(plan_limit, 0);
          
          WHEN 'pumps' THEN
            SELECT COUNT(*) INTO current_usage
            FROM pumps 
            WHERE station_id = p_station_id AND is_active = true;
            
            SELECT p.max_pumps INTO plan_limit
            FROM stations s
            JOIN plans p ON s.current_plan_id = p.id
            WHERE s.id = p_station_id;
            
            RETURN COALESCE(current_usage, 0) < COALESCE(plan_limit, 0);
          
          ELSE
            RETURN false;
        END CASE;
      END;
      $$ LANGUAGE plpgsql;
      `
    ];

    // Execute each function
    for (const func of functions) {
      const { error } = await supabase.rpc('exec_sql', { sql: func });
      if (error && !error.message.includes('already exists')) {
        console.error('Function creation error:', error);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Database functions created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Database functions error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
