
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useStationPumps(stationId?: number) {
  return useQuery({
    queryKey: ["pumps", stationId],
    queryFn: async () => {
      if (!stationId) return [];
      const { data, error } = await supabase
        .from("pumps")
        .select("id, pump_sno, name")
        .eq("station_id", stationId)
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!stationId,
  });
}
