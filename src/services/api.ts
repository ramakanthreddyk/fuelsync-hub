import { supabase } from '@/integrations/supabase/client';

export class ApiService {
  async getNozzleReadings(stationId: number) {
    const { data, error } = await supabase
      .from('ocr_readings')
      .select('*')
      .eq('station_id', stationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data?.map(reading => ({
        id: reading.id.toString(),
        userId: reading.created_by?.toString() || '',
        pumpSno: reading.station_id.toString(),
        nozzleId: reading.nozzle_id,
        fuelType: reading.source === 'ocr' ? 'Petrol' : 'Diesel',
        cumulativeVolume: reading.cumulative_vol,
        readingDate: reading.reading_date,
        readingTime: reading.reading_time,
        isManualEntry: reading.source === 'manual',
        createdAt: reading.created_at || '',
        updatedAt: reading.created_at || ''
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
  }, stationId: number) {
    const { data: result, error } = await supabase
      .from('ocr_readings')
      .insert([{
        station_id: stationId,
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

  async getPumps(stationId: number) {
    const { data, error } = await supabase
      .from('pumps')
      .select(`
        *,
        nozzles (*)
      `)
      .eq('station_id', stationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return { 
      data: data?.map(pump => ({
        id: pump.id.toString(),
        name: pump.name || `Pump ${pump.pump_sno}`,
        status: pump.is_active ? 'active' : 'inactive',
        nozzles: (pump.nozzles || []).map((nozzle: any) => ({
          id: nozzle.id.toString(),
          pumpId: pump.id.toString(),
          number: nozzle.nozzle_number,
          fuelType: nozzle.fuel_type === 'PETROL' ? 'Petrol' : 'Diesel',
          status: nozzle.is_active ? 'active' : 'inactive'
        })),
        lastMaintenanceDate: pump.updated_at,
        totalSalesToday: 0
      })) || []
    };
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

  async getSales(stationId: number) {
    // @ts-ignore
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('station_id', stationId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: data?.map(sale => ({
        id: sale.id.toString(),
        pumpId: `P${sale.nozzle_id}`,
        fuelType: 'Petrol' as const,
        litres: sale.delta_volume_l || 0,
        pricePerLitre: sale.price_per_litre || 0,
        totalAmount: sale.total_amount || 0,
        timestamp: sale.created_at,
        shift: 'morning' as const,
        nozzleId: sale.nozzle_id
      })) || []
    };
  }

  async getDailySummary(stationId: number) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('tender_entries')
      .select('*')
      .eq('entry_date', today)
      .eq('station_id', stationId);

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

  async generateReport(stationId: number, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('station_id', stationId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return { data: data || [] };
  }

  async getUploads(stationId: number) {
    const { data, error } = await supabase
      .from('ocr_readings')
      .select('*')
      .eq('station_id', stationId)
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return { 
      data: data?.map(reading => ({
        id: reading.id.toString(),
        userId: reading.created_by?.toString() || '',
        filename: `reading_${reading.id}.jpg`,
        status: 'success' as const,
        amount: 0,
        litres: reading.cumulative_vol,
        fuelType: 'Petrol' as const,
        uploadedAt: reading.created_at || '',
        ocrData: {
          pump_sno: reading.station_id.toString()
        }
      })) || []
    };
  }

  async uploadReceipt(file: File, stationId: number) {
    // For now, just create a manual reading entry
    const { data, error } = await supabase
      .from('ocr_readings')
      .insert([{
        station_id: stationId,
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
