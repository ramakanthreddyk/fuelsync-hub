
const { Sale, Pump, User } = require('../models');
const { Op } = require('sequelize');

const getSales = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Dummy sales data - remove when backend is ready
    const dummySales = [
      {
        id: '1',
        pumpId: 'pump-1',
        fuelType: 'Petrol',
        litres: 45.6,
        pricePerLitre: 105.50,
        totalAmount: 4810.80,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        shift: 'morning',
        pump: { name: 'Pump 1' },
        user: { name: 'John Doe' }
      },
      {
        id: '2',
        pumpId: 'pump-2',
        fuelType: 'Diesel',
        litres: 32.8,
        pricePerLitre: 98.75,
        totalAmount: 3239.00,
        timestamp: new Date(Date.now() - 82800000).toISOString(),
        shift: 'afternoon',
        pump: { name: 'Pump 2' },
        user: { name: 'Jane Smith' }
      },
      {
        id: '3',
        pumpId: 'pump-1',
        fuelType: 'Petrol',
        litres: 28.4,
        pricePerLitre: 105.50,
        totalAmount: 2996.20,
        timestamp: new Date(Date.now() - 79200000).toISOString(),
        shift: 'night',
        pump: { name: 'Pump 1' },
        user: { name: 'Mike Johnson' }
      },
      {
        id: '4',
        pumpId: 'pump-3',
        fuelType: 'Petrol',
        litres: 52.1,
        pricePerLitre: 105.50,
        totalAmount: 5496.55,
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        shift: 'morning',
        pump: { name: 'Pump 3' },
        user: { name: 'Sarah Wilson' }
      }
    ];

    // Filter by date if provided
    let filteredSales = dummySales;
    if (startDate || endDate) {
      filteredSales = dummySales.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        return saleDate >= start && saleDate <= end;
      });
    }

    const paginatedSales = filteredSales.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: paginatedSales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredSales.length,
        totalPages: Math.ceil(filteredSales.length / limit)
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const getDailySummary = async (req, res) => {
  try {
    const { date } = req.params;

    // Dummy daily summary - remove when backend is ready
    const summary = {
      date,
      totalRevenue: 45678.50,
      totalLitres: 456.7,
      totalTransactions: 89,
      fuelTypeBreakdown: {
        petrol: { litres: 284.2, revenue: 29978.10, transactions: 52 },
        diesel: { litres: 172.5, revenue: 15700.40, transactions: 37 }
      }
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get daily summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getSales,
  getDailySummary
};
