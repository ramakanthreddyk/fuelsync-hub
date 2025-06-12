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
    console.log('🌱 Starting database seeding...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if data already exists
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (existingUsers && existingUsers.length > 0) {
      console.log('✅ Database already seeded')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Database already contains data. No seeding needed.',
          users_count: existingUsers.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify data was inserted
    const { data: verifyUsers, error: verifyError } = await supabase
      .from('users')
      .select('id, email, role')

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError)
      throw new Error(`Verification failed: ${verifyError.message}`)
    }

    const { data: verifyStations } = await supabase
      .from('stations')
      .select('id, name')

    const { data: verifyUserStations } = await supabase
      .from('user_stations')
      .select('user_id, station_id')

    const { data: verifyPumps } = await supabase
      .from('pumps')
      .select('id, station_id, pump_sno')

    const { data: verifyNozzles } = await supabase
      .from('nozzles')
      .select('id, pump_id, fuel_type')

    console.log('✅ Verification complete:')
    console.log(`  - Users: ${verifyUsers?.length || 0}`)
    console.log(`  - Stations: ${verifyStations?.length || 0}`)
    console.log(`  - User-Station mappings: ${verifyUserStations?.length || 0}`)
    console.log(`  - Pumps: ${verifyPumps?.length || 0}`)
    console.log(`  - Nozzles: ${verifyNozzles?.length || 0}`)

    // Check if we have the minimum required data
    if (!verifyUsers || verifyUsers.length < 5) {
      throw new Error('Insufficient user data found after seeding')
    }

    if (!verifyStations || verifyStations.length < 3) {
      throw new Error('Insufficient station data found after seeding')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Database seeded successfully!',
        data: {
          users: verifyUsers.length,
          stations: verifyStations.length,
          user_stations: verifyUserStations?.length || 0,
          pumps: verifyPumps?.length || 0,
          nozzles: verifyNozzles?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Check function logs for more details'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
