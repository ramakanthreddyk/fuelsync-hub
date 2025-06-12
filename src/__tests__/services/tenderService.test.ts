
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenderService } from '@/services/tenderService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

const mockSupabase = supabase as any;

describe('TenderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDailySummary', () => {
    it('should calculate daily tender summary correctly', async () => {
      const mockTenderData = [
        { type: 'cash', amount: 1000 },
        { type: 'card', amount: 1500 },
        { type: 'cash', amount: 500 },
        { type: 'upi', amount: 800 }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: mockTenderData, error: null })
          })
        })
      });

      const summary = await tenderService.getDailySummary(1, '2024-01-01');

      expect(summary).toEqual({
        cash: 1500,
        card: 1500,
        upi: 800,
        credit: 0,
        total: 3800
      });
    });

    it('should handle empty tender data', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      });

      const summary = await tenderService.getDailySummary(1, '2024-01-01');

      expect(summary).toEqual({
        cash: 0,
        card: 0,
        upi: 0,
        credit: 0,
        total: 0
      });
    });
  });

  describe('createTenderEntry', () => {
    it('should create new tender entry', async () => {
      const mockEntry = {
        id: 1,
        station_id: 1,
        entry_date: '2024-01-01',
        type: 'cash',
        payer: 'Customer 1',
        amount: 1000,
        user_id: 1,
        created_at: '2024-01-01T00:00:00Z'
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockEntry, error: null })
          })
        })
      });

      const entryData = {
        type: 'cash' as const,
        payer: 'Customer 1',
        amount: 1000,
        entry_date: '2024-01-01',
        user_id: 1
      };

      const result = await tenderService.createTenderEntry(1, entryData);
      expect(result).toEqual(mockEntry);
    });
  });
});
