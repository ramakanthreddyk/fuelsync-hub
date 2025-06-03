
const { Sale } = require('../models');

// Get sales with filters
exports.getSales = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    
    // TODO: Replace with real DB data - returning dummy sales for frontend dev
    const dummySales = [
      {
        id: '1',
        fuelType: 'Petrol',
        pumpId: 'PUMP-001',
        litres: 45.6,
        pricePerLitre: 102.5,
        totalAmount: 4674,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        userId: req.user.id
      },
      {
        id: '2',
        fuelType: 'Diesel',
        pumpId: 'PUMP-002',
        litres: 78.2,
        pricePerLitre: 89.3,
        totalAmount: 6981,
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        userId: req.user.id
      },
      {
        id: '3',
        fuelType: 'Petrol',
        pumpId: 'PUMP-003',
        litres: 32.1,
        pricePerLitre: 102.5,
        totalAmount: 3290,
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        userId: req.user.id
      }
    ];

    res.json({
      success: true,
      data: dummySales
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales data'
    });
  }
};

// Get daily summary
exports.getDailySummary = async (req, res) => {
  try {
    const { date } = req.params;
    
    // TODO: Replace with real DB aggregation - returning dummy summary for frontend dev
    const dummySummary = {
      date: date,
      totalRevenue: 45678,
      totalLitres: 1234,
      totalTransactions: 89,
      fuelTypeBreakdown: {
        petrol: {
          revenue: 28450,
          litres: 756,
          transactions: 52
        },
        diesel: {
          revenue: 17228,
          litres: 478,
          transactions: 37
        }
      },
      hourlyBreakdown: [
        { hour: '06:00', sales: 2500, transactions: 8 },
        { hour: '07:00', sales: 4200, transactions: 12 },
        { hour: '08:00', sales: 6800, transactions: 18 },
        { hour: '09:00', sales: 5400, transactions: 15 },
        { hour: '10:00', sales: 4900, transactions: 13 },
        { hour: '11:00', sales: 3200, transactions: 9 },
        { hour: '12:00', sales: 7600, transactions: 21 }
      ]
    };

    res.json({
      success: true,
      data: dummySummary
    });
  } catch (error) {
    console.error('Error fetching daily summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily summary'
    });
  }
};

// Get shift summary
exports.getShiftSummary = async (req, res) => {
  try {
    const { date, shift } = req.params;
    
    // TODO: Replace with real DB aggregation
    const dummyShiftSummary = {
      date: date,
      shift: shift,
      revenue: 15230,
      litres: 412,
      transactions: 28,
      startTime: '06:00',
      endTime: '14:00'
    };

    res.json({
      success: true,
      data: dummyShiftSummary
    });
  } catch (error) {
    console.error('Error fetching shift summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shift summary'
    });
  }
};

// Get sales trends
exports.getSalesTrends = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // TODO: Replace with real DB aggregation
    const dummyTrends = {
      period: period,
      data: [
        { date: '2024-06-01', revenue: 45678, litres: 1234 },
        { date: '2024-06-02', revenue: 52341, litres: 1456 },
        { date: '2024-06-03', revenue: 48923, litres: 1298 },
        { date: '2024-06-04', revenue: 41256, litres: 1102 },
        { date: '2024-06-05', revenue: 38945, litres: 1034 },
        { date: '2024-06-06', revenue: 43567, litres: 1189 },
        { date: '2024-06-07', revenue: 47892, litres: 1267 }
      ]
    };

    res.json({
      success: true,
      data: dummyTrends
    });
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales trends'
    });
  }
};
