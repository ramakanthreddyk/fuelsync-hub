
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { planLimitsService, PlanLimitsError } from '@/services/planLimitsService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

const mockSupabase = supabase as any;

describe('PlanLimitsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlanLimits', () => {
    it('should return plan limits for a station', async () => {
      const mockPlan = {
        plans: {
          max_pumps: 5,
          max_nozzles: 10,
          max_employees: 5,
          max_ocr_monthly: 50,
          allow_manual_entry: true,
          edit_fuel_type: true,
          export_reports: true
        }
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockPlan, error: null })
          })
        })
      });

      const limits = await planLimitsService.getPlanLimits(1);

      expect(limits).toEqual({
        maxPumps: 5,
        maxNozzles: 10,
        maxEmployees: 5,
        maxOcrMonthly: 50,
        allowManualEntry: true,
        editFuelType: true,
        exportReports: true
      });
    });

    it('should throw error if station not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } })
          })
        })
      });

      await expect(planLimitsService.getPlanLimits(999)).rejects.toThrow('Station not found');
    });
  });

  describe('checkPumpLimit', () => {
    it('should throw PlanLimitsError when pump limit exceeded', async () => {
      // Mock plan limits
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plans: { max_pumps: 2 } },
              error: null
            })
          })
        })
      });

      // Mock pump count
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 2, error: null })
          })
        })
      });

      await expect(planLimitsService.checkPumpLimit(1)).rejects.toThrow(PlanLimitsError);
      await expect(planLimitsService.checkPumpLimit(1)).rejects.toThrow('PUMP_LIMIT_EXCEEDED');
    });

    it('should not throw error when under pump limit', async () => {
      // Mock plan limits
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { plans: { max_pumps: 5 } },
              error: null
            })
          })
        })
      });

      // Mock pump count
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 2, error: null })
          })
        })
      });

      await expect(planLimitsService.checkPumpLimit(1)).resolves.not.toThrow();
    });
  });
});
