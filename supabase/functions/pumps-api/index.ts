
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      pumps: {
        Row: {
          id: number
          station_id: number
          pump_sno: string
          name: string | null
          status: 'active' | 'inactive' | 'maintenance'
          location: string | null
          installation_date: string | null
          created_by: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          station_id: number
          pump_sno: string
          name?: string
          status?: 'active' | 'inactive' | 'maintenance'
          location?: string
          installation_date?: string
          created_by?: number
        }
        Update: {
          name?: string
          status?: 'active' | 'inactive' | 'maintenance'
          location?: string
        }
      }
      nozzles: {
        Row: {
          id: number
          pump_id: number
          nozzle_number: number
          fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV'
          status: 'active' | 'inactive'
          max_flow_rate: number
          created_at: string
          updated_at: string
        }
        Insert: {
          pump_id: number
          nozzle_number: number
          fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV'
          status?: 'active' | 'inactive'
          max_flow_rate?: number
        }
        Update: {
          fuel_type?: 'PETROL' | 'DIESEL' | 'CNG' | 'EV'
          status?: 'active' | 'inactive'
          max_flow_rate?: number
        }
      }
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
    
    console.log('API Request:', req.method, url.pathname)

    // GET /pumps - List all pumps for a station
    if (req.method === 'GET' && pathParts.length === 0) {
      const stationId = url.searchParams.get('stationId')
      
      if (!stationId) {
        return new Response(JSON.stringify({ error: 'Station ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: pumps, error } = await supabase
        .from('pumps')
        .select(`
          *,
          nozzles (
            id,
            nozzle_number,
            fuel_type,
            status,
            max_flow_rate
          )
        `)
        .eq('station_id', parseInt(stationId))
        .order('pump_sno')

      if (error) {
        console.error('Error fetching pumps:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: true, data: pumps }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /pumps/:id - Get detailed pump info
    if (req.method === 'GET' && pathParts.length === 1) {
      const pumpId = parseInt(pathParts[0])

      const { data: pump, error } = await supabase
        .from('pumps')
        .select(`
          *,
          nozzles (
            id,
            nozzle_number,
            fuel_type,
            status,
            max_flow_rate
          ),
          sales (
            id,
            delta_volume_l,
            total_amount,
            fuel_type,
            shift,
            created_at
          )
        `)
        .eq('id', pumpId)
        .single()

      if (error) {
        console.error('Error fetching pump details:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Calculate today's sales summary
      const today = new Date().toISOString().split('T')[0]
      const todaySales = pump.sales?.filter(sale => 
        sale.created_at.startsWith(today)
      ) || []

      const salesSummary = {
        totalSales: todaySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0),
        totalLitres: todaySales.reduce((sum, sale) => sum + (sale.delta_volume_l || 0), 0),
        transactionCount: todaySales.length,
        byFuelType: {
          PETROL: todaySales.filter(s => s.fuel_type === 'PETROL').reduce((sum, s) => sum + (s.total_amount || 0), 0),
          DIESEL: todaySales.filter(s => s.fuel_type === 'DIESEL').reduce((sum, s) => sum + (s.total_amount || 0), 0)
        }
      }

      return new Response(JSON.stringify({
        success: true,
        data: { ...pump, salesSummary }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /pumps - Create new pump
    if (req.method === 'POST' && pathParts.length === 0) {
      const body = await req.json()
      const { stationId, pump_sno, name, location, status, created_by } = body

      if (!stationId || !pump_sno || !created_by) {
        return new Response(JSON.stringify({ error: 'Station ID, pump serial number, and created_by are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: pump, error } = await supabase
        .from('pumps')
        .insert({
          station_id: parseInt(stationId),
          pump_sno,
          name: name || `Pump ${pump_sno}`,
          location,
          status: status || 'active',
          created_by: parseInt(created_by),
          installation_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating pump:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Pump created successfully:', pump)
      return new Response(JSON.stringify({ success: true, data: pump }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // POST /pumps/:pumpId/nozzles - Add nozzles to pump
    if (req.method === 'POST' && pathParts.length === 2 && pathParts[1] === 'nozzles') {
      const pumpId = parseInt(pathParts[0])
      const body = await req.json()
      const { fuel_type, nozzle_number, max_flow_rate, status } = body

      if (!fuel_type || !nozzle_number) {
        return new Response(JSON.stringify({ error: 'Fuel type and nozzle number are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: nozzle, error } = await supabase
        .from('nozzles')
        .insert({
          pump_id: pumpId,
          fuel_type,
          nozzle_number: parseInt(nozzle_number),
          max_flow_rate: parseFloat(max_flow_rate) || 35.0,
          status: status || 'active'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating nozzle:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Nozzle created successfully:', nozzle)
      return new Response(JSON.stringify({ success: true, data: nozzle }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE /pumps/:id - Delete pump
    if (req.method === 'DELETE' && pathParts.length === 1) {
      const pumpId = parseInt(pathParts[0])

      const { error } = await supabase
        .from('pumps')
        .delete()
        .eq('id', pumpId)

      if (error) {
        console.error('Error deleting pump:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Pump deleted successfully:', pumpId)
      return new Response(JSON.stringify({ success: true, message: 'Pump deleted successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Route not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
