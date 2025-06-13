
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

    if (req.method === 'POST') {
      const { email } = await req.json();

      if (!email) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Security check: Only allow known demo emails or existing superadmin users
      const allowedDomains = ['@fuelsync.com'];
      const isAllowedEmail = allowedDomains.some(domain => email.endsWith(domain));
      
      if (!isAllowedEmail) {
        console.log(`Unauthorized confirmation attempt for email: ${email}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Email confirmation not allowed for this domain' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user exists in our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        console.log(`User not found in users table: ${email}`);
        return new Response(
          JSON.stringify({ success: false, error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the auth user
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch user data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const authUser = authUsers.users.find(u => u.email === email);
      
      if (!authUser) {
        console.log(`Auth user not found: ${email}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Auth user not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Skip if already confirmed
      if (authUser.email_confirmed_at) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User already confirmed',
            already_confirmed: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Confirm the user
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        {
          email_confirm: true,
          email_confirmed_at: new Date().toISOString(),
        }
      );

      if (updateError) {
        console.error(`Error confirming user ${email}:`, updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to confirm user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Successfully confirmed user: ${email}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User confirmed successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Confirm user error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
