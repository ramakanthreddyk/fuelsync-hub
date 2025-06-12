
// Database types matching the new fuel station schema
export interface User {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  password: string;
  role: 'superadmin' | 'owner' | 'employee';
  station_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Station {
  id: number;
  name: string;
  brand: 'IOCL' | 'BPCL' | 'HPCL';
  address: string | null;
  owner_id: number;
  current_plan_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: number;
  name: string;
  price_monthly: number | null;
  max_pumps: number | null;
  max_nozzles: number | null;
  max_employees: number | null;
  max_ocr_monthly: number | null;
  allow_manual_entry: boolean;
  edit_fuel_type: boolean;
  export_reports: boolean;
  features: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface Pump {
  id: number;
  station_id: number;
  pump_sno: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Nozzle {
  id: number;
  pump_id: number;
  nozzle_number: number;
  fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OCRReading {
  id: number;
  station_id: number;
  nozzle_id: number;
  source: 'ocr' | 'manual';
  reading_date: string;
  reading_time: string;
  cumulative_vol: number;
  image_url: string | null;
  created_by: number | null;
  created_at: string;
}

export interface FuelPrice {
  id: number;
  station_id: number | null;
  fuel_type: 'PETROL' | 'DIESEL' | 'CNG' | 'EV';
  price_per_litre: number;
  valid_from: string;
  created_by: number | null;
  created_at: string;
}

export interface Sale {
  id: number;
  station_id: number | null;
  nozzle_id: number | null;
  reading_id: number | null;
  delta_volume_l: number | null;
  price_per_litre: number | null;
  total_amount: number | null;
  created_at: string;
}

export interface TenderEntry {
  id: number;
  station_id: number | null;
  entry_date: string;
  type: 'cash' | 'card' | 'upi' | 'credit' | null;
  payer: string | null;
  amount: number | null;
  user_id: number | null;
  created_at: string;
}

export interface DailyClosure {
  station_id: number;
  date: string;
  sales_total: number | null;
  tender_total: number | null;
  difference: number | null;
  closed_by: number | null;
  closed_at: string;
}

export interface PlanUsage {
  station_id: number;
  month: string;
  ocr_count: number;
  pumps_used: number;
  nozzles_used: number;
  employees_count: number;
}
