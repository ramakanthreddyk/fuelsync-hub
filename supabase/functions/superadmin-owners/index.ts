
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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for superadmin role
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify role == superadmin in users table
    const { data: userData, error: roleError } = await supabaseAdmin
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

      if (!name || !email || !password || !stationName || !brand || !address) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing required fields: name, email, password, stationName, brand, address'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 1. Create user in Auth
      const { data: authUserResp, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, phone, role: 'owner' }
      });
      if (authErr) {
        return new Response(
          JSON.stringify({ success: false, error: `Failed to create Auth user: ${authErr.message || authErr}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const authUser = authUserResp.user;

      // 2. Insert user in DB (no password field!), use Auth UID as PK + auth_uid
      const { data: ownerData, error: ownerError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.id, // Auth UID as PK
          email,
          phone,
          name,
          role: 'owner',
          is_active: true,
          auth_uid: authUser.id
        })
        .select()
        .single();

      if (ownerError) {
        // Cleanup Auth user on error
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);
        return new Response(
          JSON.stringify({ success: false, error: `Failed to create owner in users table: ${ownerError.message || ownerError}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 3. Create station for the owner
      const { data: stationData, error: stationError } = await supabaseAdmin
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
        // Rollback: delete owner from users and Auth
        await supabaseAdmin.from('users').delete().eq('id', ownerData.id);
        await supabaseAdmin.auth.admin.deleteUser(authUser.id);

        return new Response(
          JSON.stringify({ success: false, error: `Failed to create station: ${stationError.message || stationError}` }),
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
      JSON.stringify({ success: false, error: `Internal server error: ${error && error.message ? error.message : String(error)}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
