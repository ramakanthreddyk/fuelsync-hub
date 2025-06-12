
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      sales: {
        Row: {
          id: number
          station_id: number
          pump_id: number
          nozzle_id: number
          delta_volume_l: number
          price_per_litre: number
          total_amount: number
          shift: 'morning' | 'afternoon' | 'night'
          fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV'
          entered_by: number
          is_manual_entry: boolean
          created_at: string
        }
        Insert: {
          station_id: number
          pump_id: number
          nozzle_id: number
          delta_volume_l: number
          price_per_litre: number
          total_amount: number
          shift: 'morning' | 'afternoon' | 'night'
          fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV'
          entered_by: number
          is_manual_entry?: boolean
        }
      }
      tender_entries: {
        Row: {
          id: number
          station_id: number
          entry_date: string
          type: 'cash' | 'card' | 'upi' | 'credit'
          payer: string | null
          amount: number
          user_id: number
          created_at: string
        }
      }
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    console.log('Sales API Request:', req.method, url.pathname)

    // GET /sales - List sales for a station
    if (req.method === 'GET' && pathParts.length === 0) {
      const stationId = url.searchParams.get('stationId')
      const startDate = url.searchParams.get('startDate')
      const endDate = url.searchParams.get('endDate')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      
      if (!stationId) {
        return new Response(JSON.stringify({ error: 'Station ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      let query = supabase
        .from('sales')
        .select(`
          *,
          pumps (pump_sno, name),
          nozzles (nozzle_number, fuel_type),
          users (name)
        `)
        .eq('station_id', parseInt(stationId))
        .order('created_at', { ascending: false })
        .limit(limit)

      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data: sales, error } = await query

      if (error) {
        console.error('Error fetching sales:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: true, data: sales }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /sales/manual - Create manual sale entry
    if (req.method === 'POST' && pathParts.length === 1 && pathParts[0] === 'manual') {
      const body = await req.json()
      const { 
        stationId, 
        pumpId, 
        nozzleId, 
        litres, 
        fuelType, 
        pricePerLitre, 
        shift, 
        enteredBy 
      } = body

      if (!stationId || !pumpId || !nozzleId || !litres || !fuelType || !pricePerLitre || !shift || !enteredBy) {
        return new Response(JSON.stringify({ 
          error: 'All fields are required: stationId, pumpId, nozzleId, litres, fuelType, pricePerLitre, shift, enteredBy' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const totalAmount = parseFloat((parseFloat(litres) * parseFloat(pricePerLitre)).toFixed(2))

      const { data: sale, error } = await supabase
        .from('sales')
        .insert({
          station_id: parseInt(stationId),
          pump_id: parseInt(pumpId),
          nozzle_id: parseInt(nozzleId),
          delta_volume_l: parseFloat(litres),
          price_per_litre: parseFloat(pricePerLitre),
          total_amount: totalAmount,
          shift,
          fuel_type: fuelType,
          entered_by: parseInt(enteredBy),
          is_manual_entry: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating manual sale:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Manual sale created successfully:', sale)
      return new Response(JSON.stringify({ success: true, data: sale }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /sales/daily-summary - Get daily sales summary
    if (req.method === 'GET' && pathParts.length === 1 && pathParts[0] === 'daily-summary') {
      const stationId = url.searchParams.get('stationId')
      const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]
      
      if (!stationId) {
        return new Response(JSON.stringify({ error: 'Station ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get sales for the day
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('station_id', parseInt(stationId))
        .gte('created_at', date)
        .lt('created_at', new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])

      // Get tender entries for the day
      const { data: tenders, error: tendersError } = await supabase
        .from('tender_entries')
        .select('*')
        .eq('station_id', parseInt(stationId))
        .eq('entry_date', date)

      if (salesError || tendersError) {
        console.error('Error fetching daily summary:', salesError || tendersError)
        return new Response(JSON.stringify({ error: (salesError || tendersError)?.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Calculate sales summary
      const salesTotal = sales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0
      const salesByFuel = {
        PETROL: sales?.filter(s => s.fuel_type === 'PETROL').reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0,
        DIESEL: sales?.filter(s => s.fuel_type === 'DIESEL').reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0
      }

      // Calculate tender summary
      const tenderTotal = tenders?.reduce((sum, tender) => sum + (tender.amount || 0), 0) || 0
      const tenderByType = {
        cash: tenders?.filter(t => t.type === 'cash').reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        card: tenders?.filter(t => t.type === 'card').reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        upi: tenders?.filter(t => t.type === 'upi').reduce((sum, t) => sum + (t.amount || 0), 0) || 0,
        credit: tenders?.filter(t => t.type === 'credit').reduce((sum, t) => sum + (t.amount || 0), 0) || 0
      }

      const summary = {
        date,
        salesTotal,
        tenderTotal,
        difference: tenderTotal - salesTotal,
        salesByFuel,
        tenderByType,
        totalTransactions: sales?.length || 0,
        totalLitres: sales?.reduce((sum, sale) => sum + (sale.delta_volume_l || 0), 0) || 0
      }

      return new Response(JSON.stringify({ success: true, data: summary }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Route not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Sales API Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
