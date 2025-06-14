import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = "https://untzkhbbsowpkmwrxdws.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudHpraGJic293cGttd3J4ZHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTQ2ODAsImV4cCI6MjA2NTI5MDY4MH0.aEJHq7lKjbKMa0JIqxIT9wjfMY4PGd1bTkC-t2smSGs";

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
  // Use both user and session from useAuth
  const { user, session } = useAuth();
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

  // Get the current session's access token for the Authorization header
  const getAuthHeader = () => {
    return session?.access_token || "";
  };

  useEffect(() => {
    if (currentStation) {
      loadDashboardData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStation, session]);

  const loadDashboardData = async () => {
    if (!currentStation) {
      console.warn("No currentStation selected in useDashboardData");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Loading dashboard data for station", currentStation);

      // Build headers for Edge Function calls
      const accessToken = getAuthHeader();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "authorization": `Bearer ${accessToken}`,
      };

      // Fetch dashboard summary
      const summaryRes = await fetch(
        `${SUPABASE_URL}/functions/v1/dashboard-api/summary?stationId=${currentStation.id}`,
        {
          method: "GET",
          headers,
        }
      );
      const summaryResult = await summaryRes.json();
      console.log("Dashboard summary result:", summaryResult);

      if (!summaryRes.ok || summaryResult?.error) {
        throw new Error(summaryResult?.error || "Failed to load dashboard summary");
      }
      const summary = summaryResult.data;

      // Fetch sales trends
      const trendsRes = await fetch(
        `${SUPABASE_URL}/functions/v1/dashboard-api/sales-trend?stationId=${currentStation.id}`,
        {
          method: "GET",
          headers
        }
      );
      const trendsResult = await trendsRes.json();
      console.log("Dashboard trends result:", trendsResult);

      if (!trendsRes.ok || trendsResult?.error) {
        throw new Error(trendsResult?.error || "Failed to load trends data");
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
      setData(prev => ({
        ...prev,
        alerts: [
          {
            id: 'load_error',
            type: 'error',
            message: 'Failed to load dashboard data',
            severity: 'high',
            tags: ['system']
          }
        ]
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, refetch: loadDashboardData };
};
