
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
    const { data, error } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('station_id', stationId)
      .gte('created_at', `${date}T00:00:00Z`)
      .lt('created_at', `${date}T23:59:59Z`);

    if (error) {
      throw new Error(`Failed to calculate daily sales: ${error.message}`);
    }

    return data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
  },

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

    const { data, error } = await supabase
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
      .single();

    if (error) {
      throw new Error(`Failed to create daily closure: ${error.message}`);
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
