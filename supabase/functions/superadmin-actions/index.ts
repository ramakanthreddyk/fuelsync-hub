
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

    if (req.method === 'PUT') {
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const action = pathParts[pathParts.length - 1];
      const id = pathParts[pathParts.length - 2];

      if (action === 'activate') {
        // Toggle user activation status
        const { is_active } = await req.json();
        
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ is_active })
          .eq('id', parseInt(id))
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user status:', updateError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to update user status' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: updatedUser }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'deactivate') {
        // Toggle station activation status
        const { is_active } = await req.json();
        
        const { data: updatedStation, error: updateError } = await supabase
          .from('stations')
          .update({ is_active })
          .eq('id', parseInt(id))
          .select()
          .single();

        if (updateError) {
          console.error('Error updating station status:', updateError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to update station status' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, data: updatedStation }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'plan') {
        // Update station plan
        const { planId, isPaid } = await req.json();
        
        // Insert new plan assignment
        const { data: planAssignment, error: planError } = await supabase
          .from('station_plans')
          .insert({
            station_id: parseInt(id),
            plan_id: planId,
            effective_from: new Date().toISOString(),
            is_paid: isPaid || false
          })
          .select()
          .single();

        if (planError) {
          console.error('Error updating station plan:', planError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to update station plan' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Update station current_plan_id
        await supabase
          .from('stations')
          .update({ current_plan_id: planId })
          .eq('id', parseInt(id));

        return new Response(
          JSON.stringify({ success: true, data: planAssignment }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'assign') {
        // Assign pump or nozzle to station
        const { stationId, pumpId } = await req.json();
        
        if (pathParts.includes('pumps')) {
          // Assign pump to station
          const { data: assignment, error: assignError } = await supabase
            .from('pump_assignments')
            .insert({
              pump_id: parseInt(id),
              station_id: stationId,
              assigned_at: new Date().toISOString()
            })
            .select()
            .single();

          if (assignError) {
            console.error('Error assigning pump:', assignError);
            return new Response(
              JSON.stringify({ success: false, error: 'Failed to assign pump' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, data: assignment }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (pathParts.includes('nozzles')) {
          // Assign nozzle to station
          const { data: assignment, error: assignError } = await supabase
            .from('nozzle_assignments')
            .insert({
              nozzle_id: parseInt(id),
              station_id: stationId,
              assigned_at: new Date().toISOString()
            })
            .select()
            .single();

          if (assignError) {
            console.error('Error assigning nozzle:', assignError);
            return new Response(
              JSON.stringify({ success: false, error: 'Failed to assign nozzle' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, data: assignment }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action or method' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Superadmin actions error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
