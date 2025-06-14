import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface ManualEntryData {
  station_id: number;
  nozzle_id: number;
  cumulative_volume: number;
  user_id: string;
}

interface SalesFilters {
  station_id?: number;
  pump_id?: number;
  nozzle_id?: number;
  start_date?: string;
  end_date?: string;
  today?: boolean;
}

export function useSalesManagement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createManualEntry = useMutation({
    mutationFn: async (data: ManualEntryData) => {
      const { data: result, error } = await supabase.functions.invoke('sales-management', {
        body: { ...data, user_id: user?.id },
        method: 'POST'
      });

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
    },
  });

  const getSales = (filters: SalesFilters = {}) => {
    return useQuery({
      queryKey: ['sales', filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });

        const { data, error } = await supabase.functions.invoke('sales-management', {
          body: null,
          method: 'GET'
        });

        if (error) throw error;
        return data;
      },
    });
  };

  const getSalesSummary = (filters: SalesFilters = {}) => {
    return useQuery({
      queryKey: ['sales-summary', filters],
      queryFn: async () => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });

        const { data, error } = await supabase.functions.invoke('sales-management', {
          body: null,
          method: 'GET'
        });

        if (error) throw error;
        return data;
      },
    });
  };

  return {
    createManualEntry,
    getSales,
    getSalesSummary,
  };
}
