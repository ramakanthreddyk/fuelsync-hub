
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
  async getDailyClosure(stationId: number, date: string): Promise<DailyClosure | null> {
    const { data, error } = await supabase
      .from('daily_closure')
      .select('*')
      .eq('station_id', stationId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch daily closure: ${error.message}`);
    }

    return data;
  },

  async calculateDailySummary(stationId: number, date: string) {
    // Get sales total for the day
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('station_id', stationId)
      .gte('created_at', `${date}T00:00:00`)
      .lt('created_at', `${date}T23:59:59`);

    if (salesError) {
      throw new Error(`Failed to calculate sales total: ${salesError.message}`);
    }

    const salesTotal = salesData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;

    // Get tender total for the day
    const tenderSummary = await tenderService.getDailySummary(stationId, date);
    const tenderTotal = tenderSummary.total;

    return {
      salesTotal,
      tenderTotal,
      difference: tenderTotal - salesTotal
    };
  },

  async finalizeDailyClosure(
    stationId: number,
    date: string,
    userId: number
  ): Promise<DailyClosure> {
    const summary = await this.calculateDailySummary(stationId, date);

    const { data, error } = await supabase
      .from('daily_closure')
      .upsert({
        station_id: stationId,
        date,
        sales_total: summary.salesTotal,
        tender_total: summary.tenderTotal,
        difference: summary.difference,
        closed_by: userId,
        closed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to finalize daily closure: ${error.message}`);
    }

    return data;
  },

  async getClosureHistory(
    stationId: number,
    limit: number = 30
  ): Promise<DailyClosure[]> {
    const { data, error } = await supabase
      .from('daily_closure')
      .select('*')
      .eq('station_id', stationId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch closure history: ${error.message}`);
    }

    return data || [];
  }
};
