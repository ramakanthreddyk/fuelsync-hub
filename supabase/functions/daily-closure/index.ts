
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

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/')
    const stationId = url.searchParams.get('station_id')
    const date = url.searchParams.get('date')

    if (!stationId || !date) {
      return new Response(
        JSON.stringify({ success: false, error: 'station_id and date are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET') {
      // Get daily closure data
      const { data: closureData, error: closureError } = await supabase
        .from('daily_closure')
        .select('*')
        .eq('station_id', parseInt(stationId))
        .eq('date', date)
        .single()

      if (closureError && closureError.code !== 'PGRST116') {
        throw closureError
      }

      // Calculate daily summary
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('station_id', parseInt(stationId))
        .gte('created_at', `${date}T00:00:00`)
        .lt('created_at', `${date}T23:59:59`)

      if (salesError) throw salesError

      const { data: tenderData, error: tenderError } = await supabase
        .from('tender_entries')
        .select('amount')
        .eq('station_id', parseInt(stationId))
        .eq('entry_date', date)

      if (tenderError) throw tenderError

      const salesTotal = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0
      const tenderTotal = tenderData?.reduce((sum, tender) => sum + (tender.amount || 0), 0) || 0

      const result = closureData || {
        station_id: parseInt(stationId),
        date,
        sales_total: salesTotal,
        tender_total: tenderTotal,
        difference: tenderTotal - salesTotal,
        closed_by: null,
        closed_at: null
      }

      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'POST' && url.pathname.includes('finalize')) {
      const body = await req.json()
      const { closed_by } = body

      if (!closed_by) {
        return new Response(
          JSON.stringify({ success: false, error: 'closed_by is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Calculate totals
      const { data: salesData } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('station_id', parseInt(stationId))
        .gte('created_at', `${date}T00:00:00`)
        .lt('created_at', `${date}T23:59:59`)

      const { data: tenderData } = await supabase
        .from('tender_entries')
        .select('amount')
        .eq('station_id', parseInt(stationId))
        .eq('entry_date', date)

      const salesTotal = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0
      const tenderTotal = tenderData?.reduce((sum, tender) => sum + (tender.amount || 0), 0) || 0

      const { data, error } = await supabase
        .from('daily_closure')
        .upsert({
          station_id: parseInt(stationId),
          date,
          sales_total: salesTotal,
          tender_total: tenderTotal,
          difference: tenderTotal - salesTotal,
          closed_by,
          closed_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Daily closure error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
