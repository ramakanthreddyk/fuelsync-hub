
import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useRoleAccess } from "./useRoleAccess";

export function useDailySummary(date: string) {
  // const { currentStation, canAccessAllStations } = useRoleAccess();

  return useQuery({
    queryKey: ['daily-summary', date],
    queryFn: async () => {
      // Sales/tender_entries table not implemented!
      // Return zero/empty data for now
      return {
        sales_total: 0,
        tender_total: 0,
        difference: 0,
        breakdown: { cash: 0, card: 0, upi: 0, credit: 0 }
      };
    },
    enabled: true,
  });
}
