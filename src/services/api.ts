
import { 
  User, 
  Upload, 
  Sale, 
  FuelPrice, 
  Pump, 
  DailySummary, 
  NozzleReading,
  ApiResponse 
} from '@/types/api';

// API Service Class for multi-tenant fuel station management
class ApiService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('fuelsync_token');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
        return {
          success: false,
          error: 'Session expired. Please login again.'
        };
      }

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('fuelsync_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('fuelsync_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Multi-tenant station access methods
  async getUserStations(userId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/users/${userId}/stations`);
  }

  async getStationData(stationId: number): Promise<ApiResponse<any>> {
    return this.request(`/stations/${stationId}`);
  }

  // Plan limits and enforcement
  async checkPlanLimits(stationId: number, action: string): Promise<ApiResponse<boolean>> {
    return this.request(`/stations/${stationId}/plan-limits/check`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  async getPlanUsage(stationId: number): Promise<ApiResponse<any>> {
    return this.request(`/stations/${stationId}/plan-usage`);
  }

  // Fuel prices with historical tracking
  async getFuelPrices(stationId: number): Promise<ApiResponse<FuelPrice[]>> {
    return this.request(`/stations/${stationId}/fuel-prices`);
  }

  async updateFuelPrice(
    stationId: number, 
    fuelType: string, 
    price: number,
    userId: number
  ): Promise<ApiResponse<FuelPrice>> {
    return this.request(`/stations/${stationId}/fuel-prices`, {
      method: 'POST',
      body: JSON.stringify({ fuel_type: fuelType, price_per_litre: price, created_by: userId }),
    });
  }

  // Tender entries
  async getTenderEntries(stationId: number, date?: string): Promise<ApiResponse<any[]>> {
    const params = date ? `?date=${date}` : '';
    return this.request(`/stations/${stationId}/tender-entries${params}`);
  }

  async createTenderEntry(stationId: number, entryData: any): Promise<ApiResponse<any>> {
    return this.request(`/stations/${stationId}/tender-entries`, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  // Daily closure
  async getDailyClosure(stationId: number, date: string): Promise<ApiResponse<any>> {
    return this.request(`/stations/${stationId}/daily-closure/${date}`);
  }

  async createDailyClosure(stationId: number, date: string, userId: number): Promise<ApiResponse<any>> {
    return this.request(`/stations/${stationId}/daily-closure`, {
      method: 'POST',
      body: JSON.stringify({ date, closed_by: userId }),
    });
  }

  // OCR readings with plan enforcement
  async uploadOCRImage(stationId: number, file: File, nozzleId: number): Promise<ApiResponse<any>> {
    // Check plan limits first
    const limitCheck = await this.checkPlanLimits(stationId, 'ocr_upload');
    if (!limitCheck.success || !limitCheck.data) {
      return {
        success: false,
        error: 'OCR upload limit exceeded for current plan'
      };
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('nozzle_id', nozzleId.toString());
    formData.append('station_id', stationId.toString());

    try {
      const response = await fetch(`${this.baseUrl}/stations/${stationId}/ocr-upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      });

      return await response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async createManualReading(stationId: number, readingData: any): Promise<ApiResponse<any>> {
    // Check if manual entry is allowed
    const limitCheck = await this.checkPlanLimits(stationId, 'manual_entry');
    if (!limitCheck.success || !limitCheck.data) {
      return {
        success: false,
        error: 'Manual entry not allowed for current plan'
      };
    }

    return this.request(`/stations/${stationId}/ocr-readings/manual`, {
      method: 'POST',
      body: JSON.stringify(readingData),
    });
  }

  // Export reports (plan dependent)
  async exportReport(stationId: number, reportType: string, format: string): Promise<ApiResponse<any>> {
    const limitCheck = await this.checkPlanLimits(stationId, 'export_reports');
    if (!limitCheck.success || !limitCheck.data) {
      return {
        success: false,
        error: 'Report export not available for current plan'
      };
    }

    return this.request(`/stations/${stationId}/reports/export`, {
      method: 'POST',
      body: JSON.stringify({ type: reportType, format }),
    });
  }

  // Event logging
  async logEvent(stationId: number, eventType: string, payload: any): Promise<ApiResponse<any>> {
    return this.request(`/stations/${stationId}/events`, {
      method: 'POST',
      body: JSON.stringify({ event_type: eventType, payload }),
    });
  }
}

export const apiService = new ApiService();
