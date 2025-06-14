
import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fuelPriceService } from "@/services/fuelPriceService";

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
    fuelPrices: {}
  });
  const [isLoading, setIsLoading] = useState(true);

  const currentStation = user?.stations?.[0];
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (currentStation) {
      loadDashboardData();
    }
  }, [currentStation]);

  const loadDashboardData = async () => {
    if (!currentStation) return;

    try {
      // Get today's sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('station_id', currentStation.id)
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${today}T23:59:59Z`);

      const todaySales = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

      // Get today's tender
      const { data: tenderData } = await supabase
        .from('tender_entries')
        .select('amount')
        .eq('station_id', currentStation.id)
        .eq('entry_date', today);

      const todayTender = tenderData?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0;

      // Get total readings count
      const { count: readingsCount } = await supabase
        .from('ocr_readings')
        .select('*', { count: 'exact' })
        .eq('station_id', currentStation.id);

      // Get last reading time
      const { data: lastReadingData } = await supabase
        .from('ocr_readings')
        .select('created_at')
        .eq('station_id', currentStation.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Get 7-day trends
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      
      const trendsData = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];

        // Get sales for this date
        const { data: dailySales } = await supabase
          .from('sales')
          .select('total_amount')
          .eq('station_id', currentStation.id)
          .gte('created_at', `${dateStr}T00:00:00Z`)
          .lt('created_at', `${dateStr}T23:59:59Z`);

        // Get tender for this date
        const { data: dailyTender } = await supabase
          .from('tender_entries')
          .select('amount')
          .eq('station_id', currentStation.id)
          .eq('entry_date', dateStr);

        trendsData.push({
          date: dateStr,
          sales: dailySales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0,
          tender: dailyTender?.reduce((sum, entry) => sum + (entry.amount || 0), 0) || 0,
        });
      }

      // Get pending closures (simplified - count days without closure)
      const { count: pendingClosures } = await supabase
        .from('daily_closure')
        .select('*', { count: 'exact' })
        .eq('station_id', currentStation.id)
        .eq('date', today);

      // Get current fuel prices
      const fuelPrices = {};
      try {
        const prices = await fuelPriceService.getFuelPrices(currentStation.id);
        const fuelTypes = ['PETROL', 'DIESEL', 'CNG', 'EV'] as const;
        
        for (const fuelType of fuelTypes) {
          const latestPrice = prices
            .filter(p => p.fuel_type === fuelType)
            .sort((a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime())[0];
          
          if (latestPrice) {
            fuelPrices[fuelType] = latestPrice.price_per_litre;
          }
        }
      } catch (error) {
        console.error('Error loading fuel prices:', error);
      }

      setData({
        todaySales,
        todayTender,
        totalReadings: readingsCount || 0,
        lastReading: lastReadingData?.[0]?.created_at || null,
        pendingClosures: pendingClosures === 0 ? 1 : 0, // Inverted logic: 0 means closure exists
        trendsData,
        fuelPrices
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, refetch: loadDashboardData };
};
