
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
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
        Update: {
          fuel_type?: 'PETROL' | 'DIESEL' | 'CNG' | 'EV'
          status?: 'active' | 'inactive'
          max_flow_rate?: number
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
    
    console.log('Nozzles API Request:', req.method, url.pathname)

    // PUT /nozzles/:id - Update nozzle
    if (req.method === 'PUT' && pathParts.length === 1) {
      const nozzleId = parseInt(pathParts[0])
      const body = await req.json()
      const { fuel_type, status, max_flow_rate } = body

      const updateData: any = {}
      if (fuel_type) updateData.fuel_type = fuel_type
      if (status) updateData.status = status
      if (max_flow_rate) updateData.max_flow_rate = parseFloat(max_flow_rate)

      const { data: nozzle, error } = await supabase
        .from('nozzles')
        .update(updateData)
        .eq('id', nozzleId)
        .select()
        .single()

      if (error) {
        console.error('Error updating nozzle:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Nozzle updated successfully:', nozzle)
      return new Response(JSON.stringify({ success: true, data: nozzle }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // DELETE /nozzles/:id - Delete nozzle
    if (req.method === 'DELETE' && pathParts.length === 1) {
      const nozzleId = parseInt(pathParts[0])

      const { error } = await supabase
        .from('nozzles')
        .delete()
        .eq('id', nozzleId)

      if (error) {
        console.error('Error deleting nozzle:', error)
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Nozzle deleted successfully:', nozzleId)
      return new Response(JSON.stringify({ success: true, message: 'Nozzle deleted successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Route not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Nozzles API Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
