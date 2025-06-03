// API Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Pump Owner' | 'Manager' | 'Employee';
  plan: 'Free' | 'Basic' | 'Premium';
  stationId?: string;
  planId?: string;
  customLimits?: Record<string, any>;
  createdAt?: string;
}

export interface Upload {
  id: string;
  userId: string;
  filename: string;
  status: 'processing' | 'success' | 'failed';
  amount: number;
  litres: number;
  fuelType: 'Petrol' | 'Diesel';
  uploadedAt: string;
  processedAt?: string;
  ocrData?: {
    amount: number;
    litres: number;
    fuelType: string;
    pumpId?: string;
    timestamp?: string;
  };
}

export interface Sale {
  id: string;
  pumpId: string;
  fuelType: 'Petrol' | 'Diesel';
  litres: number;
  pricePerLitre: number;
  totalAmount: number;
  timestamp: string;
  shift: 'morning' | 'afternoon' | 'night';
}

export interface FuelPrice {
  id: string;
  fuelType: 'Petrol' | 'Diesel';
  price: number;
  updatedAt: string;
  updatedBy: string;
}

export interface Pump {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'maintenance';
  nozzles: Nozzle[];
  lastMaintenanceDate: string;
  totalSalesToday: number;
}

export interface Nozzle {
  id: string;
  pumpId: string;
  number: number;
  fuelType: 'Petrol' | 'Diesel';
  status: 'active' | 'inactive';
}

export interface DailySummary {
  date: string;
  totalRevenue: number;
  totalLitres: number;
  totalTransactions: number;
  fuelTypeBreakdown: {
    petrol: { litres: number; revenue: number; transactions: number };
    diesel: { litres: number; revenue: number; transactions: number };
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
