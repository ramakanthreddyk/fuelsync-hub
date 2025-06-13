
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
          nozzle_id: number
          reading_id: number | null
          delta_volume_l: number
          price_per_litre: number
          total_amount: number
          created_at: string
        }
        Insert: {
          station_id: number
          nozzle_id: number
          reading_id?: number | null
          delta_volume_l: number
          price_per_litre: number
          total_amount: number
        }
      }
      ocr_readings: {
        Row: {
          id: number
          station_id: number
          nozzle_id: number
          source: 'ocr' | 'manual'
          reading_date: string
          reading_time: string
          cumulative_vol: number
          created_by: number | null
          created_at: string
        }
        Insert: {
          station_id: number
          nozzle_id: number
          source: 'ocr' | 'manual'
          reading_date: string
          reading_time: string
          cumulative_vol: number
          created_by?: number | null
        }
      }
      fuel_prices: {
        Row: {
          id: number
          station_id: number | null
          fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV'
          price_per_litre: number
          valid_from: string
          created_at: string
        }
      }
      nozzles: {
        Row: {
          id: number
          pump_id: number
          nozzle_number: number
          fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV'
          is_active: boolean
        }
      }
      pumps: {
        Row: {
          id: number
          station_id: number
          pump_sno: string
          name: string | null
          is_active: boolean
        }
      }
      event_log: {
        Row: {
          id: number
          event_type: string
          station_id: number | null
          user_id: number | null
          payload: any
          occurred_at: string
        }
        Insert: {
          event_type: string
          station_id?: number | null
          user_id?: number | null
          payload?: any
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

    console.log('Sales Management API Request:', req.method, url.pathname)

    // POST /sales-management - Create manual sale entry with calculations
    if (req.method === 'POST' && pathParts.length === 1 && pathParts[0] === 'sales-management') {
      const body = await req.json()
      const station_id = parseInt(body.station_id)
      const nozzle_id = parseInt(body.nozzle_id)
      const user_id = parseInt(body.user_id)
      const cumulative_volume = parseFloat(body.cumulative_volume)

      console.log('Manual entry request:', { station_id, nozzle_id, cumulative_volume, user_id })

      if (!station_id || !nozzle_id || !cumulative_volume || !user_id) {
        return new Response(JSON.stringify({ 
          error: 'Missing required fields: station_id, nozzle_id, cumulative_volume, user_id' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      try {
        const { data: nozzle, error: nozzleError } = await supabase
          .from('nozzles')
          .select('fuel_type')
          .eq('id', nozzle_id)
          .single()

        if (nozzleError || !nozzle) throw new Error('Nozzle not found')

        const { data: lastReading, error: lastReadingError } = await supabase
          .from('ocr_readings')
          .select('cumulative_vol')
          .eq('nozzle_id', nozzle_id)
          .eq('station_id', station_id)
          .order('reading_date', { ascending: false })
          .order('reading_time', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (lastReadingError) throw new Error('Error fetching last reading')

        const previousVolume = lastReading?.cumulative_vol || 0
        const deltaVolume = parseFloat((cumulative_volume - previousVolume).toFixed(3))

        if (deltaVolume < 0) {
          return new Response(JSON.stringify({ 
            error: 'New cumulative volume cannot be less than previous reading' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

        const { data: fuelPrice, error: priceError } = await supabase
          .from('fuel_prices')
          .select('price_per_litre')
          .eq('fuel_type', nozzle.fuel_type)
          .or(`station_id.eq.${station_id},station_id.is.null`)
          .lte('valid_from', new Date().toISOString())
          .order('valid_from', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (priceError || !fuelPrice) throw new Error('Fuel price not found')

        const pricePerLitre = parseFloat(fuelPrice.price_per_litre.toString())
        const totalAmount = parseFloat((deltaVolume * pricePerLitre).toFixed(2))

        const now = new Date()
        const { data: ocrReading, error: ocrError } = await supabase
          .from('ocr_readings')
          .insert({
            station_id,
            nozzle_id,
            source: 'manual',
            reading_date: now.toISOString().split('T')[0],
            reading_time: now.toTimeString().slice(0, 8),
            cumulative_vol: cumulative_volume,
            created_by: user_id
          })
          .select()
          .single()

        if (ocrError) throw new Error('Error creating OCR reading')

        // Log manual reading event
        await supabase
          .from('event_log')
          .insert({
            event_type: 'manual_reading',
            station_id,
            user_id,
            payload: {
              nozzle_id,
              cumulative_volume,
              delta_volume: deltaVolume,
              price_per_litre: pricePerLitre,
              total_amount: totalAmount,
              fuel_type: nozzle.fuel_type
            }
          })

        if (deltaVolume > 0) {
          const { data: sale, error: saleError } = await supabase
            .from('sales')
            .insert({
              station_id,
              nozzle_id,
              reading_id: ocrReading.id,
              delta_volume_l: parseFloat(deltaVolume.toFixed(3)),
              price_per_litre: parseFloat(pricePerLitre.toFixed(2)),
              total_amount: parseFloat(totalAmount.toFixed(2))
            })
            .select()
            .single()

          if (saleError) throw new Error('Error creating sale')

          return new Response(JSON.stringify({
            success: true,
            data: {
              sale,
              ocrReading,
              calculated: { deltaVolume, pricePerLitre, totalAmount }
            }
          }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          return new Response(JSON.stringify({
            success: true,
            data: {
              ocrReading,
              message: 'Reading recorded, no sale created (zero volume delta)'
            }
          }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (err) {
        console.error('Error in manual-entry POST handler:', err)
        return new Response(JSON.stringify({ error: err.message || 'Unexpected error' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }
    
    // GET /sales - Get sales with filters
    if (req.method === 'GET' && pathParts.length === 1 && pathParts[0] === 'sales') {
      const stationId = url.searchParams.get('station_id')
      const pumpId = url.searchParams.get('pump_id')
      const nozzleId = url.searchParams.get('nozzle_id')
      const startDate = url.searchParams.get('start_date')
      const endDate = url.searchParams.get('end_date')
      const isToday = url.searchParams.get('today') === 'true'

      let query = supabase
        .from('sales')
        .select(`
          *,
          nozzles (
            id,
            nozzle_number,
            fuel_type,
            pump_id,
            pumps (
              id,
              pump_sno,
              name,
              station_id
            )
          )
        `)
        .order('created_at', { ascending: false })

      if (stationId) {
        query = query.eq('station_id', parseInt(stationId))
      }

      if (nozzleId) {
        query = query.eq('nozzle_id', parseInt(nozzleId))
      }

      if (isToday) {
        const today = new Date().toISOString().split('T')[0]
        query = query.gte('created_at', `${today}T00:00:00Z`)
                   .lt('created_at', `${today}T23:59:59Z`)
      } else {
        if (startDate) {
          query = query.gte('created_at', `${startDate}T00:00:00Z`)
        }
        if (endDate) {
          query = query.lte('created_at', `${endDate}T23:59:59Z`)
        }
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

    // GET /summary - Get sales summary grouped by station/pump/nozzle
    if (req.method === 'GET' && pathParts.length === 1 && pathParts[0] === 'summary') {
      const stationId = url.searchParams.get('station_id')
      const startDate = url.searchParams.get('start_date')
      const endDate = url.searchParams.get('end_date')
      const isToday = url.searchParams.get('today') === 'true'

      let query = supabase
        .from('sales')
        .select(`
          station_id,
          nozzle_id,
          delta_volume_l,
          total_amount,
          nozzles (
            id,
            nozzle_number,
            fuel_type,
            pump_id,
            pumps (
              id,
              pump_sno,
              name,
              station_id
            )
          )
        `)

      if (stationId) {
        query = query.eq('station_id', parseInt(stationId))
      }

      if (isToday) {
        const today = new Date().toISOString().split('T')[0]
        query = query.gte('created_at', `${today}T00:00:00Z`)
                   .lt('created_at', `${today}T23:59:59Z`)
      } else {
        if (startDate) {
          query = query.gte('created_at', `${startDate}T00:00:00Z`)
        }
        if (endDate) {
          query = query.lte('created_at', `${endDate}T23:59:59Z`)
        }
      }

      const { data: sales, error } = await query

      if (error) {
        console.error('Error fetching sales summary:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Group by station, pump, nozzle
      const summary = {
        stations: {} as any,
        pumps: {} as any,
        nozzles: {} as any,
        total: { volume: 0, amount: 0, transactions: 0 }
      }

      sales?.forEach((sale: any) => {
        const volume = parseFloat(sale.delta_volume_l) || 0
        const amount = parseFloat(sale.total_amount) || 0
        const stationId = sale.station_id
        const pumpId = sale.nozzles?.pump_id
        const nozzleId = sale.nozzle_id

        // Station summary
        if (!summary.stations[stationId]) {
          summary.stations[stationId] = { volume: 0, amount: 0, transactions: 0 }
        }
        summary.stations[stationId].volume += volume
        summary.stations[stationId].amount += amount
        summary.stations[stationId].transactions += 1

        // Pump summary
        if (pumpId) {
          if (!summary.pumps[pumpId]) {
            summary.pumps[pumpId] = { 
              volume: 0, 
              amount: 0, 
              transactions: 0,
              pump_sno: sale.nozzles?.pumps?.pump_sno,
              name: sale.nozzles?.pumps?.name
            }
          }
          summary.pumps[pumpId].volume += volume
          summary.pumps[pumpId].amount += amount
          summary.pumps[pumpId].transactions += 1
        }

        // Nozzle summary
        if (!summary.nozzles[nozzleId]) {
          summary.nozzles[nozzleId] = { 
            volume: 0, 
            amount: 0, 
            transactions: 0,
            nozzle_number: sale.nozzles?.nozzle_number,
            fuel_type: sale.nozzles?.fuel_type
          }
        }
        summary.nozzles[nozzleId].volume += volume
        summary.nozzles[nozzleId].amount += amount
        summary.nozzles[nozzleId].transactions += 1

        // Total summary
        summary.total.volume += volume
        summary.total.amount += amount
        summary.total.transactions += 1
      })

      return new Response(JSON.stringify({ success: true, data: summary }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Route not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Sales Management API Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
