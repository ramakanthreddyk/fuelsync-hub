
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

    // Create the increment_ocr_usage function
    const { error: functionError } = await supabase.rpc('create_increment_ocr_function')

    if (functionError && !functionError.message.includes('already exists')) {
      console.error('Error creating function:', functionError)
    }

    const sql = `
      CREATE OR REPLACE FUNCTION increment_ocr_usage(p_station_id INT, p_month DATE)
      RETURNS VOID AS $$
      BEGIN
        INSERT INTO plan_usage (station_id, month, ocr_count)
        VALUES (p_station_id, p_month, 1)
        ON CONFLICT (station_id, month)
        DO UPDATE SET ocr_count = plan_usage.ocr_count + 1;
      END;
      $$ LANGUAGE plpgsql;
    `

    const { error: sqlError } = await supabase.rpc('exec_sql', { sql })

    if (sqlError) {
      console.error('SQL execution error:', sqlError)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Plan functions created' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Plan functions error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
