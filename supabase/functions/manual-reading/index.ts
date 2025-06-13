import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json();
    const { station_id, nozzle_id, cumulative_vol, reading_date, reading_time } = body;

    if (!station_id || !nozzle_id || cumulative_vol === undefined || !reading_date || !reading_time) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: station_id, nozzle_id, cumulative_vol, reading_date, reading_time'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Manual reading request:', { station_id, nozzle_id, cumulative_vol, reading_date, reading_time });

    const authHeader = req.headers.get('Authorization');
    let userId: number | null = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      userId = user?.id ?? null;
    }

    const { data: nozzleData, error: nozzleError } = await supabase
      .from('nozzles')
      .select(`id, pump_id, pumps!inner(id, station_id, pump_sno)`)
      .eq('id', nozzle_id)
      .eq('pumps.station_id', station_id)
      .single();

    if (nozzleError || !nozzleData) {
      console.error('Nozzle validation error:', nozzleError);
      return new Response(JSON.stringify({
        error: 'Invalid nozzle or station combination'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({
        error: 'Failed to save reading: ' + insertError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Manual reading saved:', reading);

    const { data: previous, error: prevError } = await supabase
      .from("ocr_readings")
      .select("cumulative_vol")
      .eq("station_id", station_id)
      .eq("nozzle_id", nozzle_id)
      .neq("id", reading.id)
      .order("reading_date", { ascending: false })
      .order("reading_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    const previousVol = previous?.cumulative_vol || 0;
    const deltaVol = parseFloat((reading.cumulative_vol - previousVol).toFixed(3));

    if (deltaVol <= 0) {
      console.log("ℹ️ Skipping sale creation due to non-positive delta:", deltaVol);
    } else {
      const { data: nozzleFuel, error: nozzleFuelError } = await supabase
        .from("nozzles")
        .select("fuel_type")
        .eq("id", nozzle_id)
        .single();

      if (nozzleFuelError || !nozzleFuel) {
        console.warn("⚠️ Nozzle fuel type not found");
      } else {
        const { data: priceRow, error: priceError } = await supabase
          .from("fuel_prices")
          .select("price_per_litre")
          .eq("fuel_type", nozzleFuel.fuel_type)
          .or(`station_id.eq.${station_id},station_id.is.null`)
          .lte("valid_from", new Date().toISOString())
          .order("valid_from", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (priceError || !priceRow) {
          console.warn("⚠️ No fuel price found");
        } else {
          const pricePerLitre = parseFloat(priceRow.price_per_litre.toString());
          const totalAmount = parseFloat((deltaVol * pricePerLitre).toFixed(2));

          const { error: saleError } = await supabase.from("sales").insert({
            station_id: parseInt(station_id),
            nozzle_id: parseInt(nozzle_id),
            reading_id: reading.id,
            delta_volume_l: deltaVol,
            price_per_litre: pricePerLitre,
            total_amount: totalAmount
          });

          if (saleError) {
            console.error("❌ Failed to insert sale:", saleError);
          } else {
            console.log("💰 Sale recorded:", { deltaVol, pricePerLitre, totalAmount });
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: reading
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Manual reading error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
