
import { supabase } from '@/integrations/supabase/client';

export interface PlanLimits {
  maxPumps: number;
  maxNozzles: number;
  maxEmployees: number;
  maxOcrMonthly: number;
  allowManualEntry: boolean;
  editFuelType: boolean;
  exportReports: boolean;
}

export class PlanLimitsError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PlanLimitsError';
  }
}

export const planLimitsService = {
  async checkPlanLimits(stationId: number): Promise<PlanLimits> {
    const { data: station, error: stationError } = await supabase
      .from('stations')
      .select(`
        current_plan_id,
        plans!inner(
          max_pumps,
          max_nozzles,
          max_employees,
          max_ocr_monthly,
          allow_manual_entry,
          edit_fuel_type,
          export_reports
        )
      `)
      .eq('id', stationId)
      .single();

    if (stationError || !station) {
      throw new Error('Station not found');
    }

    return {
      maxPumps: station.plans.max_pumps || 0,
      maxNozzles: station.plans.max_nozzles || 0,
      maxEmployees: station.plans.max_employees || 0,
      maxOcrMonthly: station.plans.max_ocr_monthly || 0,
      allowManualEntry: station.plans.allow_manual_entry,
      editFuelType: station.plans.edit_fuel_type,
      exportReports: station.plans.export_reports
    };
  },

  async checkPumpLimit(stationId: number): Promise<void> {
    const limits = await this.checkPlanLimits(stationId);
    
    const { count } = await supabase
      .from('pumps')
      .select('*', { count: 'exact', head: true })
      .eq('station_id', stationId)
      .eq('is_active', true);

    if (count && count >= limits.maxPumps) {
      throw new PlanLimitsError(
        `Maximum pumps limit (${limits.maxPumps}) reached for your plan`,
        'PLAN_LIMIT_EXCEEDED'
      );
    }
  },

  async checkEmployeeLimit(stationId: number): Promise<void> {
    const limits = await this.checkPlanLimits(stationId);
    
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('station_id', stationId)
      .eq('role', 'employee')
      .eq('is_active', true);

    if (count && count >= limits.maxEmployees) {
      throw new PlanLimitsError(
        `Maximum employees limit (${limits.maxEmployees}) reached for your plan`,
        'PLAN_LIMIT_EXCEEDED'
      );
    }
  },

  async checkOcrLimit(stationId: number): Promise<void> {
    const limits = await this.checkPlanLimits(stationId);
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    
    const { count } = await supabase
      .from('ocr_readings')
      .select('*', { count: 'exact', head: true })
      .eq('station_id', stationId)
      .gte('created_at', `${currentMonth}-01`)
      .lt('created_at', `${currentMonth}-32`);

    if (count && count >= limits.maxOcrMonthly) {
      throw new PlanLimitsError(
        `OCR quota exceeded for this plan (${limits.maxOcrMonthly}/month)`,
        'PLAN_LIMIT_EXCEEDED'
      );
    }
  },

  async checkManualEntryAllowed(stationId: number): Promise<void> {
    const limits = await this.checkPlanLimits(stationId);
    
    if (!limits.allowManualEntry) {
      throw new PlanLimitsError(
        'Manual entry not allowed for your plan',
        'PLAN_LIMIT_EXCEEDED'
      );
    }
  }
};
