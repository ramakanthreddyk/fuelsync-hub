
import { supabase } from '@/integrations/supabase/client';
import { tenderService } from './tenderService';

export interface DailyClosure {
  station_id: number;
  date: string;
  sales_total: number;
  tender_total: number;
  difference: number;
  closed_by: number;
  closed_at: string;
}

export const dailyClosureService = {
  async calculateDailySales(stationId: number, date: string): Promise<number> {
    const { data, error } = await (supabase as any)
      .from('sales')
      .select('total_amount')
      .eq('station_id', stationId)
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`);

    if (error) {
      throw new Error(`Failed to calculate daily sales: ${error.message}`);
    }

    // Defensive: Accumulate only if total_amount is present
    return Array.isArray(data)
      ? data.reduce((sum, sale) => sum + (sale?.total_amount || 0), 0)
      : 0;
  },

  async getDailyClosure(stationId: number, date: string): Promise<DailyClosure | null> {
    const { data, error } = await (supabase as any)
      .from('daily_closure')
      .select('*')
      .eq('station_id', stationId)
      .eq('date', date)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch daily closure: ${error.message}`);
    }

    // Confirm the data has closure fields
    if (data && data.station_id && data.sales_total !== undefined) {
      return data as DailyClosure;
    }

    return null;
  },

  async createDailyClosure(
    stationId: number,
    date: string,
    userId: number
  ): Promise<DailyClosure> {
    // Calculate sales total
    const salesTotal = await this.calculateDailySales(stationId, date);

    // Calculate tender total
    const tenderSummary = await tenderService.getDailySummary(stationId, date);
    const tenderTotal = tenderSummary.total;

    // Calculate difference
    const difference = salesTotal - tenderTotal;

    const { data, error } = await (supabase as any)
      .from('daily_closure')
      .insert({
        station_id: stationId,
        date,
        sales_total: salesTotal,
        tender_total: tenderTotal,
        difference,
        closed_by: userId,
        closed_at: new Date().toISOString()
      })
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to create daily closure: ${error.message}`);
    }

    return data as DailyClosure;
  },

  async getClosureHistory(
    stationId: number,
    limit: number = 30
  ): Promise<DailyClosure[]> {
    const { data, error } = await (supabase as any)
      .from('daily_closure')
      .select('*')
      .eq('station_id', stationId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch closure history: ${error.message}`);
    }

    // Filter/convert only valid rows
    return Array.isArray(data)
      ? data.filter((row: any) =>
          row && row.station_id !== undefined &&
          row.sales_total !== undefined &&
          row.tender_total !== undefined &&
          row.date !== undefined
        ) as DailyClosure[]
      : [];
  }
};
