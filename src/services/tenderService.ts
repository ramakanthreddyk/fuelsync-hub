
import { supabase } from '@/integrations/supabase/client';

export interface TenderEntry {
  id: number;
  station_id: number;
  entry_date: string;
  type: 'cash' | 'card' | 'upi' | 'credit';
  payer: string;
  amount: number;
  user_id: number;
  created_at: string;
}

export const tenderService = {
  async getTenderEntries(
    stationId: number,
    date?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ data: TenderEntry[]; total: number }> {
    let query = supabase
      .from('tender_entries')
      .select('*', { count: 'exact' })
      .eq('station_id', stationId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (date) {
      query = query.eq('entry_date', date);
    }

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to fetch tender entries: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0
    };
  },

  async createTenderEntry(
    stationId: number,
    entryData: {
      type: 'cash' | 'card' | 'upi' | 'credit';
      payer: string;
      amount: number;
      entry_date: string;
      user_id: number;
    }
  ): Promise<TenderEntry> {
    const { data, error } = await supabase
      .from('tender_entries')
      .insert({
        station_id: stationId,
        ...entryData
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create tender entry: ${error.message}`);
    }

    return data;
  },

  async getDailySummary(stationId: number, date: string) {
    const { data, error } = await supabase
      .from('tender_entries')
      .select('type, amount')
      .eq('station_id', stationId)
      .eq('entry_date', date);

    if (error) {
      throw new Error(`Failed to fetch daily tender summary: ${error.message}`);
    }

    const summary = {
      cash: 0,
      card: 0,
      upi: 0,
      credit: 0,
      total: 0
    };

    data?.forEach(entry => {
      summary[entry.type] += entry.amount;
      summary.total += entry.amount;
    });

    return summary;
  }
};
