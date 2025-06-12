
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fuelPriceService } from '@/services/fuelPriceService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

const mockSupabase = supabase as any;

describe('FuelPriceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentPrice', () => {
    it('should return current price for fuel type', async () => {
      const mockPrice = { price_per_litre: 105.50 };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockPrice, error: null })
                  })
                })
              })
            })
          })
        })
      });

      const price = await fuelPriceService.getCurrentPrice(1, 'PETROL');
      expect(price).toBe(105.50);
    });

    it('should throw error when no price found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
                  })
                })
              })
            })
          })
        })
      });

      await expect(fuelPriceService.getCurrentPrice(1, 'PETROL'))
        .rejects.toThrow('No price found for PETROL at station 1');
    });
  });

  describe('updateFuelPrice', () => {
    it('should create new fuel price entry', async () => {
      const mockNewPrice = {
        id: 1,
        station_id: 1,
        fuel_type: 'PETROL',
        price_per_litre: 106.00,
        valid_from: '2024-01-01T00:00:00Z',
        created_by: 1,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNewPrice, error: null })
          })
        })
      });

      const result = await fuelPriceService.updateFuelPrice(1, 'PETROL', 106.00, 1);
      expect(result).toEqual(mockNewPrice);
    });
  });
});
