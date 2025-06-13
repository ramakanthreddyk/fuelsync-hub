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

    // ✅ Verify authorization header exists
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Decode JWT to check role
    const token = authHeader.replace('Bearer ', '');
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      const userRole = tokenPayload.role;

      if (userRole !== 'superadmin') {
        return new Response(
          JSON.stringify({ success: false, error: 'Superadmin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (_) {
      return new Response(
        JSON.stringify({ success: false, error: 'Malformed or invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Handle GET request
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const role = url.searchParams.get('role');
      const stationId = url.searchParams.get('stationId');

      let query = supabase
        .from('users')
        .select(`
          *,
          user_stations (station_id, stations (id, name, brand))
        `)
        .order('created_at', { ascending: false });

      if (role) query = query.eq('role', role);
      if (stationId) query = query.eq('user_stations.station_id', parseInt(stationId));

      const { data: usersData, error: usersError } = await query;

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch users' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: usersData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ❌ Other methods not allowed
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Superadmin users error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
