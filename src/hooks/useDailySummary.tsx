
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRoleAccess } from "./useRoleAccess";

export function useDailySummary(date: string) {
  const { currentStation, canAccessAllStations } = useRoleAccess();

  return useQuery({
    queryKey: ['daily-summary', currentStation?.id, date],
    queryFn: async () => {
      if (!canAccessAllStations && !currentStation?.id) {
        return {
          sales_total: 0,
          tender_total: 0,
          difference: 0,
          breakdown: { cash: 0, card: 0, upi: 0, credit: 0 }
        };
      }

      const stationId = currentStation?.id;

      // Get sales total for the date
      let salesQuery = supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', `${date}T00:00:00Z`)
        .lt('created_at', `${date}T23:59:59Z`);

      if (!canAccessAllStations && stationId) {
        salesQuery = salesQuery.eq('station_id', stationId);
      }

      // Get tender entries for the date
      let tenderQuery = supabase
        .from('tender_entries')
        .select('type, amount')
        .eq('entry_date', date);

      if (!canAccessAllStations && stationId) {
        tenderQuery = tenderQuery.eq('station_id', stationId);
      }

      const [salesResult, tenderResult] = await Promise.all([
        salesQuery,
        tenderQuery
      ]);

      if (salesResult.error) throw salesResult.error;
      if (tenderResult.error) throw tenderResult.error;

      const sales_total = salesResult.data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

      const breakdown = { cash: 0, card: 0, upi: 0, credit: 0 };
      let tender_total = 0;

      tenderResult.data?.forEach(entry => {
        const amount = entry.amount || 0;
        tender_total += amount;
        if (entry.type && breakdown.hasOwnProperty(entry.type)) {
          breakdown[entry.type as keyof typeof breakdown] += amount;
        }
      });

      return {
        sales_total,
        tender_total,
        difference: sales_total - tender_total,
        breakdown
      };
    },
    enabled: canAccessAllStations || !!currentStation?.id,
  });
}
