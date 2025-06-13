
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

    // Verify authorization header exists
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is superadmin
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
      const { action } = await req.json();

      if (action === 'confirm_all') {
        // Get all unconfirmed users from auth.users
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error('Error fetching auth users:', authError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to fetch users' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        let confirmedCount = 0;
        const errors = [];

        for (const authUser of authUsers.users) {
          // Skip if already confirmed
          if (authUser.email_confirmed_at) {
            continue;
          }

          try {
            // Update user to be confirmed
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              authUser.id,
              {
                email_confirm: true,
                email_confirmed_at: new Date().toISOString(),
              }
            );

            if (updateError) {
              console.error(`Error confirming user ${authUser.email}:`, updateError);
              errors.push(`Failed to confirm ${authUser.email}: ${updateError.message}`);
            } else {
              confirmedCount++;
              console.log(`Confirmed user: ${authUser.email}`);
            }
          } catch (error) {
            console.error(`Exception confirming user ${authUser.email}:`, error);
            errors.push(`Exception confirming ${authUser.email}: ${error.message}`);
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: {
              confirmed_count: confirmedCount,
              total_users: authUsers.users.length,
              errors: errors
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (req.method === 'GET') {
      // Get count of unconfirmed users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch users' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const unconfirmedUsers = authUsers.users.filter(user => !user.email_confirmed_at);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            total_users: authUsers.users.length,
            unconfirmed_count: unconfirmedUsers.length,
            unconfirmed_users: unconfirmedUsers.map(u => ({ 
              id: u.id, 
              email: u.email, 
              created_at: u.created_at 
            }))
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
    console.error('Confirm users error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
