
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      console.log('Auth error:', authError);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from public.users table to check role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('email', authUser.email)
      .single();

    if (userError || !userData || userData.role !== 'superadmin') {
      console.log('Role check failed:', { userData, userError });
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      // Get all stations with owner information
      const { data: stations, error } = await supabase
        .from('stations')
        .select(`
          *,
          users!stations_owner_id_fkey(name, email),
          plans!stations_current_plan_id_fkey(name, price_monthly)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching stations:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch stations' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: stations }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const { name, brand, address, owner_id, current_plan_id } = await req.json();

      if (!name || !brand || !owner_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: newStation, error: createError } = await supabase
        .from('stations')
        .insert({
          name,
          brand,
          address,
          owner_id,
          current_plan_id,
          is_active: true
        })
        .select(`
          *,
          users!stations_owner_id_fkey(name, email),
          plans!stations_current_plan_id_fkey(name, price_monthly)
        `)
        .single();

      if (createError) {
        console.error('Error creating station:', createError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create station' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: newStation }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT') {
      const { id, name, brand, address, owner_id, current_plan_id, is_active } = await req.json();

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Station ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: updatedStation, error } = await supabase
        .from('stations')
        .update({ name, brand, address, owner_id, current_plan_id, is_active })
        .eq('id', id)
        .select(`
          *,
          users!stations_owner_id_fkey(name, email),
          plans!stations_current_plan_id_fkey(name, price_monthly)
        `)
        .single();

      if (error) {
        console.error('Error updating station:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update station' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: updatedStation }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Station ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('stations')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting station:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to delete station' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Station deleted successfully' }),
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
