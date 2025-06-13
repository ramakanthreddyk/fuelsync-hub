
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is superadmin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is superadmin in our users table
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

    if (req.method === 'POST') {
      const { name, email, phone, password, stationName, brand, address } = await req.json();

      // Validate required fields
      if (!name || !email || !password || !stationName || !brand || !address) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Missing required fields: name, email, password, stationName, brand, address' 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create owner user
      const { data: ownerData, error: ownerError } = await supabase
        .from('users')
        .insert({
          name,
          email,
          phone,
          password, // In production, this should be hashed
          role: 'owner',
          is_active: true
        })
        .select()
        .single();

      if (ownerError) {
        console.error('Error creating owner:', ownerError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create owner user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create station for the owner
      const { data: stationData, error: stationError } = await supabase
        .from('stations')
        .insert({
          name: stationName,
          brand,
          address,
          owner_id: ownerData.id,
          is_active: true
        })
        .select()
        .single();

      if (stationError) {
        console.error('Error creating station:', stationError);
        // Rollback: delete the created owner
        await supabase.from('users').delete().eq('id', ownerData.id);
        
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to create station' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: { 
            owner: ownerData, 
            station: stationData 
          } 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Superadmin owners error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
