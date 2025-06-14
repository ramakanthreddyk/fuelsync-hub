
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePumpNozzles(pumpId?: number) {
  return useQuery({
    queryKey: ["nozzles", pumpId],
    queryFn: async () => {
      if (!pumpId) return [];
      const { data, error } = await supabase
        .from("nozzles")
        .select("id, nozzle_number, fuel_type")
        .eq("pump_id", pumpId)
        .order("nozzle_number", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!pumpId,
  });
}
