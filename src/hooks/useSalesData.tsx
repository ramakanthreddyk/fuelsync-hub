import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRoleAccess } from "./useRoleAccess";

interface Sale {
  id: number;
  station_id: number;
  nozzle_id: number;
  reading_id: number;
  delta_volume_l: number;
  price_per_litre: number;
  total_amount: number;
  created_at: string;
}

export function useSalesData(date?: string) {
  const { currentStation, canAccessAllStations } = useRoleAccess();

  return useQuery({
    queryKey: ['sales', currentStation?.id, date],
    queryFn: async () => {
      if (!canAccessAllStations && !currentStation?.id) {
        return [];
      }

      let query = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (!canAccessAllStations && currentStation?.id) {
        query = query.eq('station_id', currentStation.id);
      }

      if (date) {
        const startDate = `${date}T00:00:00Z`;
        const endDate = `${date}T23:59:59Z`;
        query = query.gte('created_at', startDate).lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Sale[];
    },
    enabled: canAccessAllStations || !!currentStation?.id,
  });
}
