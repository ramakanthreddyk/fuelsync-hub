
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OCRResult {
  pump_sno: string;
  reading_date: string;
  reading_time: string;
  nozzles: Array<{
    nozzle_id: number;
    cumulative_volume: number;
  }>;
}

// Mock OCR function - replace with actual Azure OCR
function mockOCRProcessing(imageBuffer: Uint8Array): OCRResult {
  // This would be replaced with actual Azure OCR API call
  const mockResult: OCRResult = {
    pump_sno: "P001",
    reading_date: new Date().toISOString().split('T')[0],
    reading_time: new Date().toTimeString().slice(0, 5),
    nozzles: [
      { nozzle_id: 1, cumulative_volume: 12345.678 },
      { nozzle_id: 2, cumulative_volume: 23456.789 }
    ]
  };
  
  console.log('Mock OCR processing completed:', mockResult);
  return mockResult;
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

    const formData = await req.formData()
    const file = formData.get('file') as File
    const pumpSnoOverride = formData.get('pump_sno') as string

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('Processing OCR upload:', file.name, file.type)

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const imageBuffer = new Uint8Array(arrayBuffer)

    // Process with OCR (mock for now)
    const ocrResult = mockOCRProcessing(imageBuffer)
    
    // Use override pump_sno if provided
    if (pumpSnoOverride) {
      ocrResult.pump_sno = pumpSnoOverride
    }

    // Find station_id from pump_sno
    const { data: pump, error: pumpError } = await supabase
      .from('pumps')
      .select('id, station_id')
      .eq('pump_sno', ocrResult.pump_sno)
      .single()

    if (pumpError || !pump) {
      console.error('Pump not found:', pumpError)
      return new Response(JSON.stringify({ 
        error: `Pump with serial number ${ocrResult.pump_sno} not found` 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get auth user
    const authHeader = req.headers.get('Authorization')
    let userId = null
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      )
      userId = user?.id
    }

    console.log('Found pump:', pump, 'User:', userId)

    // Insert readings for each nozzle
    const insertedReadings = []
    
    for (const nozzleReading of ocrResult.nozzles) {
      // Verify nozzle exists and belongs to this pump
      const { data: nozzle, error: nozzleError } = await supabase
        .from('nozzles')
        .select('id')
        .eq('id', nozzleReading.nozzle_id)
        .eq('pump_id', pump.id)
        .single()

      if (nozzleError || !nozzle) {
        console.warn(`Nozzle ${nozzleReading.nozzle_id} not found for pump ${pump.id}`)
        continue
      }

      const { data: reading, error: insertError } = await supabase
        .from('ocr_readings')
        .insert({
          station_id: pump.station_id,
          nozzle_id: nozzleReading.nozzle_id,
          pump_sno: ocrResult.pump_sno,
          reading_date: ocrResult.reading_date,
          reading_time: ocrResult.reading_time,
          cumulative_vol: nozzleReading.cumulative_volume,
          source: 'ocr',
          created_by: userId,
          ocr_json: ocrResult
        })
        .select()
        .single()

      if (insertError) {
        console.error('Insert error for nozzle', nozzleReading.nozzle_id, insertError)
        continue
      }

      insertedReadings.push(reading)
    }

    console.log('Inserted readings:', insertedReadings.length)

    return new Response(JSON.stringify({
      success: true,
      data: {
        readings_inserted: insertedReadings.length,
        ocr_preview: ocrResult,
        readings: insertedReadings
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('OCR upload error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
