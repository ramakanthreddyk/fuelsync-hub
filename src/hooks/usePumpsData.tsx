
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRoleAccess } from "./useRoleAccess";

interface Pump {
  id: number;
  pump_sno: string;
  name: string;
  is_active: boolean;
  station_id: number;
  created_at: string;
  updated_at: string;
  nozzles: Array<{
    id: number;
    nozzle_number: number;
    fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
    is_active: boolean;
  }>;
}

export function usePumpsData() {
  const { currentStation, canAccessAllStations } = useRoleAccess();

  return useQuery({
    queryKey: ['pumps', currentStation?.id],
    queryFn: async () => {
      if (!canAccessAllStations && !currentStation?.id) {
        return [];
      }

      let query = supabase
        .from('pumps')
        .select(`
          *,
          nozzles (
            id,
            nozzle_number,
            fuel_type,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      if (!canAccessAllStations && currentStation?.id) {
        query = query.eq('station_id', currentStation.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Pump[];
    },
    enabled: canAccessAllStations || !!currentStation?.id,
  });
}
