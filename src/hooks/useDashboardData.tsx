import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface DashboardData {
  todaySales: number;
  todayTender: number;
  totalReadings: number;
  lastReading: string | null;
  pendingClosures: number;
  trendsData: Array<{
    date: string;
    sales: number;
    tender: number;
  }>;
  fuelPrices: {
    PETROL?: number;
    DIESEL?: number;
    CNG?: number;
    EV?: number;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'error';
    message: string;
    severity: 'low' | 'medium' | 'high';
    tags: string[];
  }>;
}

export const useDashboardData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    todaySales: 0,
    todayTender: 0,
    totalReadings: 0,
    lastReading: null,
    pendingClosures: 0,
    trendsData: [],
    fuelPrices: {},
    alerts: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const currentStation = user?.stations?.[0];

  useEffect(() => {
    if (currentStation) {
      loadDashboardData();
    }
  }, [currentStation]);

  const loadDashboardData = async () => {
    if (!currentStation) {
      console.warn("No currentStation selected in useDashboardData");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Loading dashboard data for station", currentStation);

      // Load dashboard summary
      const { data: summaryResult, error: summaryError } = await supabase.functions.invoke('dashboard-api/summary', {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
        body: null,
        // Add query params directly to the URL (invoke doesn't accept them, so fallback below if needed)
      });

      console.log("Dashboard summary result:", summaryResult);

      if (summaryResult?.error) {
        throw new Error(summaryResult.error);
      }
      const summary = summaryResult.data;

      // Load sales trends
      const { data: trendsResult, error: trendsError } = await supabase.functions.invoke('dashboard-api/sales-trend', {
        headers: { 'Content-Type': 'application/json' },
        method: 'GET',
        body: null,
      });

      console.log("Dashboard trends result:", trendsResult);

      if (trendsResult?.error) {
        throw new Error(trendsResult.error);
      }

      const trends = trendsResult.data || [];

      // Get total readings count
      const { count: readingsCount } = await supabase
        .from('ocr_readings')
        .select('*', { count: 'exact', head: true })
        .eq('station_id', currentStation.id);

      console.log("Total readings count:", readingsCount);

      // Get last reading time
      const { data: lastReadingData } = await supabase
        .from('ocr_readings')
        .select('created_at')
        .eq('station_id', currentStation.id)
        .order('created_at', { ascending: false })
        .limit(1);

      console.log("Last reading data:", lastReadingData);

      setData({
        todaySales: summary.total_sales_today || 0,
        todayTender: summary.total_tender_today || 0,
        totalReadings: readingsCount || 0,
        lastReading: lastReadingData?.[0]?.created_at || null,
        pendingClosures: summary.pending_closure_count || 0,
        trendsData: trends,
        fuelPrices: summary.fuel_prices || {},
        alerts: summary.alerts || []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setData(prev => ({ ...prev, alerts: [
        {
          id: 'load_error',
          type: 'error',
          message: 'Failed to load dashboard data',
          severity: 'high',
          tags: ['system']
        }
      ]}));
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, refetch: loadDashboardData };
};
