
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Verify superadmin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userData, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (roleError || userData?.role !== 'superadmin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Superadmin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const ownerId = url.searchParams.get('ownerId');
      const brand = url.searchParams.get('brand');
      const active = url.searchParams.get('active');

      let query = supabase
        .from('stations')
        .select(`
          *,
          users!stations_owner_id_fkey (id, name, email),
          plans (id, name, price_monthly),
          pumps (count),
          nozzles (count)
        `)
        .order('created_at', { ascending: false });

      if (ownerId) {
        query = query.eq('owner_id', parseInt(ownerId));
      }

      if (brand) {
        query = query.eq('brand', brand);
      }

      if (active !== null) {
        query = query.eq('is_active', active === 'true');
      }

      const { data: stationsData, error: stationsError } = await query;

      if (stationsError) {
        console.error('Error fetching stations:', stationsError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch stations' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: stationsData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const { name, brand, address, owner_id, current_plan_id } = await req.json();

      if (!name || !brand || !address || !owner_id) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required fields: name, brand, address, owner_id' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: stationData, error: stationError } = await supabase
        .from('stations')
        .insert({
          name,
          brand,
          address,
          owner_id,
          current_plan_id,
          is_active: true
        })
        .select()
        .single();

      if (stationError) {
        console.error('Error creating station:', stationError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create station' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: stationData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Superadmin stations error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
