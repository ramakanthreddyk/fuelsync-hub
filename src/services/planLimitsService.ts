
import { supabase } from '@/integrations/supabase/client';

export interface PlanLimits {
  max_pumps: number;
  max_nozzles: number;
  max_employees: number;
  max_ocr_monthly: number;
  allow_manual_entry: boolean;
  edit_fuel_type: boolean;
  export_reports: boolean;
}

export interface PlanUsage {
  ocr_count: number;
  pumps_used: number;
  nozzles_used: number;
  employees_count: number;
}

export const planLimitsService = {
  async getPlanLimits(stationId: number): Promise<PlanLimits | null> {
    try {
      const { data, error } = await supabase
        .from('stations')
        .select(`
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

      if (error || !data?.plans) {
        throw new Error('Could not fetch plan limits');
      }

      return data.plans as PlanLimits;
    } catch (error) {
      console.error('Error fetching plan limits:', error);
      return null;
    }
  },

  async getCurrentUsage(stationId: number): Promise<PlanUsage> {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      
      const { data: usage, error } = await supabase
        .from('plan_usage')
        .select('*')
        .eq('station_id', stationId)
        .eq('month', currentMonth)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return usage || {
        ocr_count: 0,
        pumps_used: 0,
        nozzles_used: 0,
        employees_count: 0
      };
    } catch (error) {
      console.error('Error fetching usage:', error);
      return {
        ocr_count: 0,
        pumps_used: 0,
        nozzles_used: 0,
        employees_count: 0
      };
    }
  },

  async checkOCRLimit(stationId: number): Promise<boolean> {
    const limits = await this.getPlanLimits(stationId);
    const usage = await this.getCurrentUsage(stationId);
    
    if (!limits) return false;
    
    return usage.ocr_count < limits.max_ocr_monthly;
  },

  async checkPumpLimit(stationId: number): Promise<boolean> {
    const limits = await this.getPlanLimits(stationId);
    const usage = await this.getCurrentUsage(stationId);
    
    if (!limits) return false;
    
    return usage.pumps_used < limits.max_pumps;
  },

  async checkEmployeeLimit(stationId: number): Promise<boolean> {
    const limits = await this.getPlanLimits(stationId);
    const usage = await this.getCurrentUsage(stationId);
    
    if (!limits) return false;
    
    return usage.employees_count < limits.max_employees;
  },

  async incrementOCRUsage(stationId: number): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    
    const { error } = await supabase.rpc('increment_ocr_usage', {
      p_station_id: stationId,
      p_month: currentMonth
    });

    if (error) {
      console.error('Error incrementing OCR usage:', error);
    }
  },

  async updatePumpUsage(stationId: number): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
    
    const { data: pumpCount } = await supabase
      .from('pumps')
      .select('id', { count: 'exact' })
      .eq('station_id', stationId)
      .eq('is_active', true);

    const { error } = await supabase
      .from('plan_usage')
      .upsert({
        station_id: stationId,
        month: currentMonth,
        pumps_used: pumpCount?.length || 0
      });

    if (error) {
      console.error('Error updating pump usage:', error);
    }
  }
};
