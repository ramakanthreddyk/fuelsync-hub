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
          delta_volume_l: number
          price_per_litre: number
          total_amount: number
          created_at: string
        }
      }
      tender_entries: {
        Row: {
          id: number
          station_id: number
          entry_date: string
          type: 'cash' | 'card' | 'upi' | 'credit'
          amount: number
          created_at: string
        }
      }
      fuel_prices: {
        Row: {
          id: number
          station_id: number
          fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV'
          price_per_litre: number
          valid_from: string
        }
      }
      daily_closure: {
        Row: {
          station_id: number
          date: string
          sales_total: number
          tender_total: number
          difference: number
          closed_at: string
        }
      }
      ocr_readings: {
        Row: {
          id: number
          station_id: number
          nozzle_id: number
          reading_date: string
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

    // ----------- FIX: strip dashboard-api prefix ------------
    // E.g. for /functions/v1/dashboard-api/summary, the path is /dashboard-api/summary
    // We want to only match ['summary'] etc.
    let pathParts = url.pathname.split('/').filter(Boolean)
    const dashboardApiIdx = pathParts.indexOf('dashboard-api')
    if (dashboardApiIdx !== -1) {
      pathParts = pathParts.slice(dashboardApiIdx + 1)
    }
    // --------------------------------------------------------

    console.log('Dashboard API Request:', req.method, url.pathname)

    // ---- CALCULATE PREMIUM ACCESS (dummy logic for now, you can improve later) ----
    // In a real-world scenario, fetch user's subscription/plan info and use that.
    // For this demo, let's say query param ?isPremium=true simulates premium access,
    // otherwise return premium_required.
    const isPremium = url.searchParams.get('isPremium') === 'true';

    // GET /dashboard/summary - Get dashboard summary metrics
    if (req.method === 'GET' && pathParts.length === 1 && pathParts[0] === 'summary') {
      const stationId = url.searchParams.get('stationId')
      
      if (!stationId) {
        return new Response(JSON.stringify({ error: 'Station ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const today = new Date().toISOString().split('T')[0]

      // Get today's sales total
      const { data: salesData } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('station_id', parseInt(stationId))
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`)

      const totalSalesToday = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0

      // Get today's tender total
      const { data: tenderData } = await supabase
        .from('tender_entries')
        .select('amount')
        .eq('station_id', parseInt(stationId))
        .eq('entry_date', today)

      const totalTenderToday = tenderData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0

      // Get current fuel prices
      const { data: fuelPricesData } = await supabase
        .from('fuel_prices')
        .select('fuel_type, price_per_litre, valid_from')
        .eq('station_id', parseInt(stationId))
        .order('valid_from', { ascending: false })

      const fuelPrices = {}
      const fuelTypes = ['PETROL', 'DIESEL', 'CNG', 'EV']
      
      for (const fuelType of fuelTypes) {
        const latestPrice = fuelPricesData?.find(p => p.fuel_type === fuelType)
        if (latestPrice) {
          fuelPrices[fuelType] = latestPrice.price_per_litre
        }
      }

      // Check for pending closure
      const { data: closureData } = await supabase
        .from('daily_closure')
        .select('*')
        .eq('station_id', parseInt(stationId))
        .eq('date', today)

      const pendingClosureCount = closureData?.length === 0 ? 1 : 0

      // Generate alerts
      const alerts = []
      const variance = totalTenderToday - totalSalesToday

      // Sales vs Collections variance alert
      if (Math.abs(variance) > 100) {
        alerts.push({
          id: 'variance_alert',
          type: 'warning',
          message: `Sales-Collections variance: ₹${Math.abs(variance).toFixed(2)}`,
          severity: Math.abs(variance) > 1000 ? 'high' : 'medium',
          tags: ['finance', 'reconciliation']
        })
      }

      // Pending closure alert
      if (pendingClosureCount > 0) {
        alerts.push({
          id: 'pending_closure',
          type: 'info',
          message: `${pendingClosureCount} pending closure${pendingClosureCount > 1 ? 's' : ''}`,
          severity: 'medium',
          tags: ['operations', 'closure']
        })
      }

      // Check for missing readings (no readings in last 4 hours)
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      const { data: recentReadings } = await supabase
        .from('ocr_readings')
        .select('created_at')
        .eq('station_id', parseInt(stationId))
        .gte('created_at', fourHoursAgo)
        .limit(1)

      if (!recentReadings || recentReadings.length === 0) {
        alerts.push({
          id: 'missing_readings',
          type: 'warning',
          message: 'No readings in last 4 hours',
          severity: 'high',
          tags: ['operations', 'readings']
        })
      }

      let summary = {
        total_sales_today: totalSalesToday,
        total_tender_today: totalTenderToday,
        fuel_prices: fuelPrices,
        pending_closure_count: pendingClosureCount,
        variance: variance,
        alerts
      }

      if (!isPremium) {
        summary = {
          ...summary,
          premium_required: true
        }
      }

      return new Response(JSON.stringify({ success: true, data: summary }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // GET /dashboard/sales-trend - Get sales trend data
    if (req.method === 'GET' && pathParts.length === 1 && pathParts[0] === 'sales-trend') {
      const stationId = url.searchParams.get('stationId')
      const days = parseInt(url.searchParams.get('days') || '7')
      
      if (!stationId) {
        return new Response(JSON.stringify({ error: 'Station ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - (days - 1))

      const trendData = []

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]

        // Get sales for this date
        const { data: dailySales } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('station_id', parseInt(stationId))
          .gte('created_at', `${dateStr}T00:00:00Z`)
          .lt('created_at', `${dateStr}T23:59:59Z`)

        // Get tender for this date
        const { data: dailyTender } = await supabase
          .from('tender_entries')
          .select('amount')
          .eq('station_id', parseInt(stationId))
          .eq('entry_date', dateStr)

        const salesTotal = dailySales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0
        const tenderTotal = dailyTender?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0

        trendData.push({
          date: dateStr,
          sales: salesTotal,
          tender: tenderTotal,
          day_name: date.toLocaleDateString('en-US', { weekday: 'short' })
        })
      }

      // Access control: block if not premium, return empty with premium metadata
      if (!isPremium) {
        return new Response(JSON.stringify({
          success: false,
          error: "Premium required to access trends",
          metadata: { premium_required: true }
        }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: true, data: trendData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Route not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Dashboard API Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
