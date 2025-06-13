
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
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');
      const stationId = url.searchParams.get('stationId');

      // Build cross-station sales summary
      let salesQuery = supabase
        .from('sales')
        .select(`
          *,
          stations (id, name, brand),
          nozzles (id, fuel_type)
        `)
        .order('created_at', { ascending: false });

      if (startDate) {
        salesQuery = salesQuery.gte('created_at', startDate);
      }

      if (endDate) {
        salesQuery = salesQuery.lte('created_at', endDate);
      }

      if (stationId && stationId !== 'all') {
        salesQuery = salesQuery.eq('station_id', parseInt(stationId));
      }

      const { data: salesData, error: salesError } = await salesQuery;

      if (salesError) {
        console.error('Error fetching sales analytics:', salesError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to fetch sales analytics' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate summary statistics
      const summary = {
        totalRevenue: salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0,
        totalVolume: salesData?.reduce((sum, sale) => sum + (sale.delta_volume_l || 0), 0) || 0,
        totalTransactions: salesData?.length || 0,
        stationBreakdown: {},
        fuelTypeBreakdown: {}
      };

      // Group by station and fuel type
      salesData?.forEach(sale => {
        const stationName = sale.stations?.name || 'Unknown';
        const fuelType = sale.nozzles?.fuel_type || 'Unknown';

        if (!summary.stationBreakdown[stationName]) {
          summary.stationBreakdown[stationName] = {
            revenue: 0,
            volume: 0,
            transactions: 0
          };
        }

        if (!summary.fuelTypeBreakdown[fuelType]) {
          summary.fuelTypeBreakdown[fuelType] = {
            revenue: 0,
            volume: 0,
            transactions: 0
          };
        }

        summary.stationBreakdown[stationName].revenue += sale.total_amount || 0;
        summary.stationBreakdown[stationName].volume += sale.delta_volume_l || 0;
        summary.stationBreakdown[stationName].transactions += 1;

        summary.fuelTypeBreakdown[fuelType].revenue += sale.total_amount || 0;
        summary.fuelTypeBreakdown[fuelType].volume += sale.delta_volume_l || 0;
        summary.fuelTypeBreakdown[fuelType].transactions += 1;
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: {
            summary,
            transactions: salesData?.slice(0, 100) // Limit detailed transactions
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
    console.error('Superadmin analytics error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
