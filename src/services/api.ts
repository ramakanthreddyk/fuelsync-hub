
import { 
  User, 
  Upload, 
  Sale, 
  FuelPrice, 
  Pump, 
  DailySummary, 
  ApiResponse 
} from '@/types/api';

// API Service Class
class ApiService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  private token: string | null = null;

  constructor() {
    // Get token from localStorage on initialization
    this.token = localStorage.getItem('fuelsync_token');
  }

  // Helper method to set authorization headers
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Helper method for API requests
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

  // Set token for authenticated requests
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('fuelsync_token', token);
  }

  // Clear token
  clearToken() {
    this.token = null;
    localStorage.removeItem('fuelsync_token');
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    console.log('API: Login attempt', { email });
    const response = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/me');
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    const response = await this.request<{ token: string }>('/auth/refresh', {
      method: 'POST',
    });

    if (response.success && response.data?.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<ApiResponse<any>> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });

    this.clearToken();
    return response;
  }

  // Upload endpoints
  async getUploads(page = 1, limit = 20): Promise<ApiResponse<Upload[]>> {
    console.log('API: Fetching uploads');
    return this.request<Upload[]>(`/uploads?page=${page}&limit=${limit}`);
  }

  async uploadReceipt(file: File): Promise<ApiResponse<Upload>> {
    console.log('API: Uploading receipt', file.name);
    
    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const response = await fetch(`${this.baseUrl}/uploads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  async updateOcrData(uploadId: string, ocrData: any): Promise<ApiResponse<Upload>> {
    console.log('API: Updating OCR data', uploadId, ocrData);
    return this.request<Upload>(`/uploads/${uploadId}`, {
      method: 'PUT',
      body: JSON.stringify(ocrData),
    });
  }

  async deleteUpload(uploadId: string): Promise<ApiResponse<any>> {
    console.log('API: Deleting upload', uploadId);
    return this.request(`/uploads/${uploadId}`, {
      method: 'DELETE',
    });
  }

  // Sales endpoints
  async getSales(startDate?: string, endDate?: string, page = 1, limit = 20): Promise<ApiResponse<Sale[]>> {
    console.log('API: Fetching sales', { startDate, endDate });
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return this.request<Sale[]>(`/sales?${params.toString()}`);
  }

  async getDailySummary(date: string): Promise<ApiResponse<DailySummary>> {
    console.log('API: Fetching daily summary', date);
    return this.request<DailySummary>(`/sales/daily/${date}`);
  }

  // Fuel price endpoints
  async getFuelPrices(): Promise<ApiResponse<FuelPrice[]>> {
    console.log('API: Fetching fuel prices');
    return this.request<FuelPrice[]>('/prices');
  }

  async updateFuelPrice(fuelType: string, price: number): Promise<ApiResponse<FuelPrice>> {
    console.log('API: Updating fuel price', fuelType, price);
    return this.request<FuelPrice>('/prices', {
      method: 'PUT',
      body: JSON.stringify({ fuelType, price }),
    });
  }

  // Pump endpoints
  async getPumps(): Promise<ApiResponse<Pump[]>> {
    console.log('API: Fetching pumps');
    return this.request<Pump[]>('/pumps');
  }

  async updatePumpStatus(pumpId: string, status: string): Promise<ApiResponse<Pump>> {
    console.log('API: Updating pump status', pumpId, status);
    return this.request<Pump>(`/pumps/${pumpId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateNozzleFuelType(nozzleId: string, fuelType: string): Promise<ApiResponse<any>> {
    console.log('API: Updating nozzle fuel type', nozzleId, fuelType);
    return this.request(`/pumps/nozzles/${nozzleId}/fuel-type`, {
      method: 'PUT',
      body: JSON.stringify({ fuelType }),
    });
  }

  // Report endpoints
  async generateReport(type: string, startDate: string, endDate: string): Promise<ApiResponse<any>> {
    console.log('API: Generating report', type, startDate, endDate);
    return this.request('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ type, startDate, endDate }),
    });
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<any>> {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
