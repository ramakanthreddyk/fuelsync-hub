
// Database types matching the new multi-tenant fuel station schema
export interface User {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  password: string;
  role: 'superadmin' | 'owner' | 'employee';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_stations?: UserStation[];
  stations?: Station[];
}

export interface UserStation {
  user_id: number;
  station_id: number;
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
  features: any;
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

export interface EventLog {
  id: number;
  user_id: number | null;
  station_id: number | null;
  event_type: string;
  payload: any;
  occurred_at: string;
}
