import { 
  User, 
  Upload, 
  Sale, 
  FuelPrice, 
  Pump, 
  DailySummary, 
  ApiResponse 
} from '@/types/api';

// Mock data
const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john@fuelstation.com',
  role: 'Pump Owner',
  plan: 'Basic',
  stationId: 'station-1'
};

const mockUploads: Upload[] = [
  {
    id: '1',
    userId: '1',
    filename: 'receipt-001.jpg',
    status: 'success',
    amount: 2450,
    litres: 45.6,
    fuelType: 'Petrol',
    uploadedAt: '2024-06-02T10:30:00Z',
    processedAt: '2024-06-02T10:31:00Z',
    ocrData: {
      amount: 2450,
      litres: 45.6,
      fuelType: 'Petrol',
      pumpId: 'pump-1',
      timestamp: '2024-06-02T10:25:00Z'
    }
  },
  {
    id: '2',
    userId: '1',
    filename: 'receipt-002.jpg',
    status: 'processing',
    amount: 1890,
    litres: 35.2,
    fuelType: 'Diesel',
    uploadedAt: '2024-06-02T09:15:00Z'
  },
  {
    id: '3',
    userId: '1',
    filename: 'receipt-003.jpg',
    status: 'success',
    amount: 3210,
    litres: 59.8,
    fuelType: 'Petrol',
    uploadedAt: '2024-06-02T08:45:00Z',
    processedAt: '2024-06-02T08:46:00Z'
  }
];

const mockSales: Sale[] = [
  {
    id: '1',
    pumpId: 'pump-1',
    fuelType: 'Petrol',
    litres: 45.6,
    pricePerLitre: 105.50,
    totalAmount: 4810.80,
    timestamp: '2024-06-02T10:25:00Z',
    shift: 'morning'
  },
  {
    id: '2',
    pumpId: 'pump-2',
    fuelType: 'Diesel',
    litres: 35.2,
    pricePerLitre: 98.75,
    totalAmount: 3476.00,
    timestamp: '2024-06-02T09:15:00Z',
    shift: 'morning'
  }
];

const mockFuelPrices: FuelPrice[] = [
  {
    id: '1',
    fuelType: 'Petrol',
    price: 105.50,
    updatedAt: '2024-06-01T08:00:00Z',
    updatedBy: 'John Doe'
  },
  {
    id: '2',
    fuelType: 'Diesel',
    price: 98.75,
    updatedAt: '2024-06-01T08:00:00Z',
    updatedBy: 'John Doe'
  }
];

const mockPumps: Pump[] = [
  {
    id: 'pump-1',
    name: 'Pump 1',
    status: 'active',
    nozzles: [
      { id: 'nozzle-1', pumpId: 'pump-1', number: 1, fuelType: 'Petrol', status: 'active' },
      { id: 'nozzle-2', pumpId: 'pump-1', number: 2, fuelType: 'Petrol', status: 'active' },
      { id: 'nozzle-3', pumpId: 'pump-1', number: 3, fuelType: 'Diesel', status: 'active' },
      { id: 'nozzle-4', pumpId: 'pump-1', number: 4, fuelType: 'Diesel', status: 'inactive' }
    ],
    lastMaintenanceDate: '2024-05-15',
    totalSalesToday: 12500
  },
  {
    id: 'pump-2',
    name: 'Pump 2',
    status: 'active',
    nozzles: [
      { id: 'nozzle-5', pumpId: 'pump-2', number: 1, fuelType: 'Petrol', status: 'active' },
      { id: 'nozzle-6', pumpId: 'pump-2', number: 2, fuelType: 'Petrol', status: 'active' },
      { id: 'nozzle-7', pumpId: 'pump-2', number: 3, fuelType: 'Diesel', status: 'active' },
      { id: 'nozzle-8', pumpId: 'pump-2', number: 4, fuelType: 'Diesel', status: 'active' }
    ],
    lastMaintenanceDate: '2024-05-20',
    totalSalesToday: 18750
  }
];

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Service Class
class ApiService {
  private baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // Simulate HTTP requests with mock data
  private async mockRequest<T>(data: T, delayMs = 500): Promise<ApiResponse<T>> {
    await delay(delayMs);
    return {
      success: true,
      data
    };
  }

  // Auth
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    console.log('API: Login attempt', { email });
    return this.mockRequest({
      user: mockUser,
      token: 'mock-jwt-token-' + Date.now()
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.mockRequest(mockUser);
  }

  // Uploads
  async getUploads(): Promise<ApiResponse<Upload[]>> {
    console.log('API: Fetching uploads');
    return this.mockRequest(mockUploads);
  }

  async uploadReceipt(file: File): Promise<ApiResponse<Upload>> {
    console.log('API: Uploading receipt', file.name);
    const newUpload: Upload = {
      id: Date.now().toString(),
      userId: mockUser.id,
      filename: file.name,
      status: 'processing',
      amount: 0,
      litres: 0,
      fuelType: 'Petrol',
      uploadedAt: new Date().toISOString()
    };
    return this.mockRequest(newUpload, 1000);
  }

  async updateOcrData(uploadId: string, ocrData: any): Promise<ApiResponse<Upload>> {
    console.log('API: Updating OCR data', uploadId, ocrData);
    const upload = mockUploads.find(u => u.id === uploadId);
    if (upload) {
      upload.ocrData = ocrData;
      upload.amount = ocrData.amount;
      upload.litres = ocrData.litres;
    }
    return this.mockRequest(upload!);
  }

  // Sales
  async getSales(startDate?: string, endDate?: string): Promise<ApiResponse<Sale[]>> {
    console.log('API: Fetching sales', { startDate, endDate });
    return this.mockRequest(mockSales);
  }

  async getDailySummary(date: string): Promise<ApiResponse<DailySummary>> {
    console.log('API: Fetching daily summary', date);
    const summary: DailySummary = {
      date,
      totalRevenue: 45678,
      totalLitres: 1234,
      totalTransactions: 89,
      fuelTypeBreakdown: {
        petrol: { litres: 734, revenue: 27890, transactions: 52 },
        diesel: { litres: 500, revenue: 17788, transactions: 37 }
      }
    };
    return this.mockRequest(summary);
  }

  // Fuel Prices
  async getFuelPrices(): Promise<ApiResponse<FuelPrice[]>> {
    console.log('API: Fetching fuel prices');
    return this.mockRequest(mockFuelPrices);
  }

  async updateFuelPrice(fuelType: string, price: number): Promise<ApiResponse<FuelPrice>> {
    console.log('API: Updating fuel price', fuelType, price);
    const updatedPrice: FuelPrice = {
      id: Date.now().toString(),
      fuelType: fuelType as 'Petrol' | 'Diesel',
      price,
      updatedAt: new Date().toISOString(),
      updatedBy: mockUser.name
    };
    return this.mockRequest(updatedPrice);
  }

  // Pumps
  async getPumps(): Promise<ApiResponse<Pump[]>> {
    console.log('API: Fetching pumps');
    return this.mockRequest(mockPumps);
  }

  async updatePumpStatus(pumpId: string, status: string): Promise<ApiResponse<Pump>> {
    console.log('API: Updating pump status', pumpId, status);
    const pump = mockPumps.find(p => p.id === pumpId);
    if (pump) {
      pump.status = status as 'active' | 'inactive' | 'maintenance';
    }
    return this.mockRequest(pump!);
  }

  async updateNozzleFuelType(nozzleId: string, fuelType: string): Promise<ApiResponse<any>> {
    console.log('API: Updating nozzle fuel type', nozzleId, fuelType);
    return this.mockRequest({ success: true });
  }

  // Reports
  async generateReport(type: string, startDate: string, endDate: string): Promise<ApiResponse<any>> {
    console.log('API: Generating report', type, startDate, endDate);
    const reportData = {
      type,
      startDate,
      endDate,
      totalRevenue: 156789,
      totalLitres: 4567,
      totalTransactions: 234,
      downloadUrl: '/api/reports/download/mock-report-' + Date.now() + '.pdf'
    };
    return this.mockRequest(reportData, 2000);
  }
}

export const apiService = new ApiService();
