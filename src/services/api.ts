
import { supabase } from '@/integrations/supabase/client';
import { NozzleReading } from '@/types/api';

export class ApiService {
  async getNozzleReadings() {
    const { data, error } = await supabase
      .from('ocr_readings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data?.map(reading => ({
        id: reading.id.toString(),
        pumpSno: reading.station_id.toString(),
        nozzleId: reading.nozzle_id,
        fuelType: reading.source === 'ocr' ? 'Petrol' : 'Diesel',
        cumulativeVolume: reading.cumulative_vol,
        readingDate: reading.reading_date,
        readingTime: reading.reading_time,
        isManualEntry: reading.source === 'manual'
      })) || []
    };
  }

  async createManualReading(data: {
    pump_sno: string;
    nozzle_id: number;
    cumulative_volume: number;
    reading_date: string;
    reading_time: string;
    fuel_type: 'Petrol' | 'Diesel';
  }) {
    const { data: result, error } = await supabase
      .from('ocr_readings')
      .insert([{
        station_id: parseInt(data.pump_sno),
        nozzle_id: data.nozzle_id,
        source: 'manual' as const,
        reading_date: data.reading_date,
        reading_time: data.reading_time,
        cumulative_vol: data.cumulative_volume
      }])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async updateNozzleReading(id: string, data: { cumulative_volume: number; fuel_type: 'Petrol' | 'Diesel' }) {
    const { data: result, error } = await supabase
      .from('ocr_readings')
      .update({
        cumulative_vol: data.cumulative_volume
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async deleteNozzleReading(id: string) {
    const { error } = await supabase
      .from('ocr_readings')
      .delete()
      .eq('id', parseInt(id));

    if (error) throw error;
  }

  async getPumps() {
    const { data, error } = await supabase
      .from('pumps')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  }

  async updatePumpStatus(id: string, isActive: boolean) {
    const { data, error } = await supabase
      .from('pumps')
      .update({ is_active: isActive })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateNozzleFuelType(id: string, fuelType: string) {
    const { data, error } = await supabase
      .from('nozzles')
      .update({ fuel_type: fuelType as any })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSales() {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  }

  async getDailySummary() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('tender_entries')
      .select('*')
      .eq('entry_date', today);

    if (error) throw error;

    const summary = {
      cash: 0,
      card: 0,
      upi: 0,
      credit: 0,
      total: 0
    };

    data?.forEach(entry => {
      const amount = entry.amount || 0;
      if (entry.type === 'cash') summary.cash += amount;
      else if (entry.type === 'card') summary.card += amount;
      else if (entry.type === 'upi') summary.upi += amount;
      else if (entry.type === 'credit') summary.credit += amount;
      summary.total += amount;
    });

    return summary;
  }

  async generateReport() {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return { data: data || [] };
  }

  async getUploads() {
    const { data, error } = await supabase
      .from('ocr_readings')
      .select('*')
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  }

  async uploadReceipt(file: File) {
    // For now, just create a manual reading entry
    const { data, error } = await supabase
      .from('ocr_readings')
      .insert([{
        station_id: 1,
        nozzle_id: 1,
        source: 'ocr' as const,
        reading_date: new Date().toISOString().split('T')[0],
        reading_time: new Date().toTimeString().slice(0, 8),
        cumulative_vol: Math.random() * 1000
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const apiService = new ApiService();
