
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

    if (req.method === 'POST') {
      const { email } = await req.json();

      if (!email) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Attempting to confirm user: ${email}`);

      // Security check: Only allow known demo emails or @fuelsync.com domain
      const allowedEmails = ['admin@fuelsync.com', 'rajesh@fuelsync.com', 'ravi@fuelsync.com'];
      const isAllowedEmail = allowedEmails.includes(email) || email.endsWith('@fuelsync.com');
      
      if (!isAllowedEmail) {
        console.log(`Unauthorized confirmation attempt for email: ${email}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Email confirmation not allowed for this domain' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if user exists in our public.users table
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        console.log(`User not found in public.users table: ${email}`, userError);
        return new Response(
          JSON.stringify({ success: false, error: 'User not found in system' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the auth user
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error fetching auth users:', authError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch user data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let authUser = authUsers.users.find(u => u.email === email);
      
      if (!authUser) {
        console.log(`Auth user not found for ${email}, creating one...`);
        
        // Create auth user if it doesn't exist
        const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password: userData.role === 'superadmin' ? 'admin123' : 
                   userData.role === 'owner' ? 'owner123' : 'emp123',
          email_confirm: true,
          user_metadata: {
            name: userData.role === 'superadmin' ? 'Super Admin' : 
                  userData.role === 'owner' ? 'Rajesh Kumar' : 'Ravi Singh'
          }
        });

        if (createError) {
          console.error(`Error creating auth user for ${email}:`, createError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to create auth user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        authUser = newAuthUser.user;
        console.log(`Successfully created and confirmed auth user: ${email}`);
      } else {
        // Update existing auth user to confirm
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          authUser.id,
          { email_confirm: true }
        );

        if (updateError) {
          console.error(`Error confirming user ${email}:`, updateError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to confirm user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Successfully confirmed existing user: ${email}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'User confirmed successfully',
          user: {
            id: authUser.id,
            email: authUser.email,
            confirmed: true
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
    console.error('Confirm user error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
