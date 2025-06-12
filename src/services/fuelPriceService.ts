
import { supabase } from '@/integrations/supabase/client';

export interface FuelPrice {
  id: number;
  station_id: number;
  fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
  price_per_litre: number;
  valid_from: string;
  created_by: number;
  created_at: string;
}

export const fuelPriceService = {
  async getFuelPrices(stationId?: number): Promise<FuelPrice[]> {
    let query = supabase
      .from('fuel_prices')
      .select('*')
      .order('valid_from', { ascending: false });

    if (stationId) {
      query = query.eq('station_id', stationId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch fuel prices: ${error.message}`);
    }

    return data || [];
  },

  async getCurrentPrice(stationId: number, fuelType: string): Promise<number> {
    const { data, error } = await supabase
      .from('fuel_prices')
      .select('price_per_litre')
      .eq('station_id', stationId)
      .eq('fuel_type', fuelType)
      .lte('valid_from', new Date().toISOString())
      .order('valid_from', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      throw new Error(`No price found for ${fuelType} at station ${stationId}`);
    }

    return data.price_per_litre;
  },

  async updateFuelPrice(
    stationId: number,
    fuelType: string,
    price: number,
    userId: number
  ): Promise<FuelPrice> {
    const { data, error } = await supabase
      .from('fuel_prices')
      .insert({
        station_id: stationId,
        fuel_type: fuelType,
        price_per_litre: price,
        valid_from: new Date().toISOString(),
        created_by: userId
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update fuel price: ${error.message}`);
    }

    return data;
  },

  async getPriceHistory(
    stationId: number,
    fuelType?: string,
    limit: number = 10
  ): Promise<FuelPrice[]> {
    let query = supabase
      .from('fuel_prices')
      .select('*')
      .eq('station_id', stationId)
      .order('valid_from', { ascending: false })
      .limit(limit);

    if (fuelType) {
      query = query.eq('fuel_type', fuelType);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch price history: ${error.message}`);
    }

    return data || [];
  }
};
