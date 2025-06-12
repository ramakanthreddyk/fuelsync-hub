
import { supabase } from '@/integrations/supabase/client';

export interface PlanLimits {
  maxPumps: number | null;
  maxNozzles: number | null;
  maxEmployees: number | null;
  maxOcrMonthly: number | null;
  allowManualEntry: boolean;
  editFuelType: boolean;
  exportReports: boolean;
}

export interface PlanUsage {
  ocrCount: number;
  pumpsUsed: number;
  nozzlesUsed: number;
  employeesCount: number;
}

export class PlanLimitsError extends Error {
  public code: string;
  
  constructor(message: string, code: string = 'PLAN_LIMIT_EXCEEDED') {
    super(message);
    this.name = 'PlanLimitsError';
    this.code = code;
  }
}

export const planLimitsService = {
  async getPlanLimits(stationId: number): Promise<PlanLimits> {
    const { data, error } = await supabase
      .from('stations')
      .select(`
        current_plan_id,
        plans:current_plan_id(
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

    if (error || !data) {
      throw new Error('Station not found');
    }

    const plan = data.plans as any;
    return {
      maxPumps: plan?.max_pumps || null,
      maxNozzles: plan?.max_nozzles || null,
      maxEmployees: plan?.max_employees || null,
      maxOcrMonthly: plan?.max_ocr_monthly || null,
      allowManualEntry: plan?.allow_manual_entry ?? true,
      editFuelType: plan?.edit_fuel_type ?? true,
      exportReports: plan?.export_reports ?? false,
    };
  },

  async getCurrentUsage(stationId: number): Promise<PlanUsage> {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    
    const { data, error } = await supabase
      .from('plan_usage')
      .select('*')
      .eq('station_id', stationId)
      .eq('month', currentMonth)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch plan usage: ${error.message}`);
    }

    return {
      ocrCount: data?.ocr_count || 0,
      pumpsUsed: data?.pumps_used || 0,
      nozzlesUsed: data?.nozzles_used || 0,
      employeesCount: data?.employees_count || 0,
    };
  },

  async checkOCRLimit(stationId: number): Promise<void> {
    const [limits, usage] = await Promise.all([
      this.getPlanLimits(stationId),
      this.getCurrentUsage(stationId)
    ]);

    if (limits.maxOcrMonthly && usage.ocrCount >= limits.maxOcrMonthly) {
      throw new PlanLimitsError(
        `OCR limit exceeded. Current usage: ${usage.ocrCount}/${limits.maxOcrMonthly}`,
        'OCR_LIMIT_EXCEEDED'
      );
    }
  },

  async checkPumpLimit(stationId: number): Promise<void> {
    const limits = await this.getPlanLimits(stationId);
    
    if (!limits.maxPumps) return;

    const { count, error } = await supabase
      .from('pumps')
      .select('*', { count: 'exact' })
      .eq('station_id', stationId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to check pump count: ${error.message}`);
    }

    if (count && count >= limits.maxPumps) {
      throw new PlanLimitsError(
        `Pump limit exceeded. Current: ${count}/${limits.maxPumps}`,
        'PUMP_LIMIT_EXCEEDED'
      );
    }
  },

  async checkEmployeeLimit(stationId: number): Promise<void> {
    const limits = await this.getPlanLimits(stationId);
    
    if (!limits.maxEmployees) return;

    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('role', 'employee')
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to check employee count: ${error.message}`);
    }

    if (count && count >= limits.maxEmployees) {
      throw new PlanLimitsError(
        `Employee limit exceeded. Current: ${count}/${limits.maxEmployees}`,
        'EMPLOYEE_LIMIT_EXCEEDED'
      );
    }
  },

  async incrementOCRUsage(stationId: number): Promise<void> {
    await this.checkOCRLimit(stationId);
    
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    
    const { error } = await supabase.rpc('increment_ocr_usage', {
      p_station_id: stationId,
      p_month: currentMonth
    });

    if (error) {
      throw new Error(`Failed to increment OCR usage: ${error.message}`);
    }
  },

  async updatePumpCount(stationId: number): Promise<void> {
    const { count } = await supabase
      .from('pumps')
      .select('*', { count: 'exact' })
      .eq('station_id', stationId)
      .eq('is_active', true);

    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    
    await supabase
      .from('plan_usage')
      .upsert({
        station_id: stationId,
        month: currentMonth,
        pumps_used: count || 0
      });
  }
};
