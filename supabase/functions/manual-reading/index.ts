
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { station_id, nozzle_id, cumulative_vol, reading_date, reading_time } = body

    // Validate required fields
    if (!station_id || !nozzle_id || cumulative_vol === undefined || !reading_date || !reading_time) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: station_id, nozzle_id, cumulative_vol, reading_date, reading_time' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Manual reading request:', { station_id, nozzle_id, cumulative_vol, reading_date, reading_time })

    // Get auth user
    const authHeader = req.headers.get('Authorization')
    let userId = null
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      )
      userId = user?.id
    }

    // Verify nozzle exists and belongs to the station
    const { data: nozzleData, error: nozzleError } = await supabase
      .from('nozzles')
      .select(`
        id,
        pump_id,
        pumps!inner (
          id,
          station_id,
          pump_sno
        )
      `)
      .eq('id', nozzle_id)
      .eq('pumps.station_id', station_id)
      .single()

    if (nozzleError || !nozzleData) {
      console.error('Nozzle validation error:', nozzleError)
      return new Response(JSON.stringify({ 
        error: 'Invalid nozzle or station combination' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Insert the manual reading
    const { data: reading, error: insertError } = await supabase
      .from('ocr_readings')
      .insert({
        station_id: parseInt(station_id),
        nozzle_id: parseInt(nozzle_id),
        pump_sno: nozzleData.pumps.pump_sno,
        reading_date,
        reading_time,
        cumulative_vol: parseFloat(cumulative_vol),
        source: 'manual',
        created_by: userId
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(JSON.stringify({ 
        error: 'Failed to save reading: ' + insertError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Manual reading saved:', reading)

    return new Response(JSON.stringify({
      success: true,
      data: reading
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Manual reading error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
