
const { FuelPrice } = require('../models');

// Get all fuel prices
exports.getFuelPrices = async (req, res) => {
  try {
    // TODO: Replace with real DB query - returning dummy prices for frontend dev
    const dummyPrices = [
      {
        id: '1',
        fuelType: 'Petrol',
        price: 102.50,
        updatedBy: 'Admin',
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        effectiveDate: new Date().toISOString()
      },
      {
        id: '2',
        fuelType: 'Diesel',
        price: 89.30,
        updatedBy: 'Admin',
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
        effectiveDate: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: dummyPrices
    });
  } catch (error) {
    console.error('Error fetching fuel prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch fuel prices'
    });
  }
};

// Update fuel price
exports.updateFuelPrice = async (req, res) => {
  try {
    const { fuelType, price } = req.body;

    // Validate input
    if (!fuelType || !price || price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fuel type or price'
      });
    }

    // TODO: Replace with real DB update
    console.log(`Updating ${fuelType} price to ₹${price}`);

    const updatedPrice = {
      id: Date.now().toString(),
      fuelType: fuelType,
      price: parseFloat(price),
      updatedBy: req.user.name || 'Admin',
      updatedAt: new Date().toISOString(),
      effectiveDate: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedPrice,
      message: `${fuelType} price updated successfully to ₹${price}`
    });
  } catch (error) {
    console.error('Error updating fuel price:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update fuel price'
    });
  }
};

// Get price history
exports.getPriceHistory = async (req, res) => {
  try {
    const { fuelType, limit = 10 } = req.query;

    // TODO: Replace with real DB query
    const dummyHistory = [
      {
        id: '1',
        fuelType: fuelType || 'Petrol',
        price: 102.50,
        previousPrice: 101.80,
        change: 0.70,
        updatedBy: 'Admin',
        updatedAt: new Date().toISOString(),
        reason: 'Market price adjustment'
      },
      {
        id: '2',
        fuelType: fuelType || 'Petrol',
        price: 101.80,
        previousPrice: 102.20,
        change: -0.40,
        updatedBy: 'Manager',
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Competitive pricing'
      }
    ];

    res.json({
      success: true,
      data: dummyHistory
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price history'
    });
  }
};

// Get price comparison with nearby stations
exports.getPriceComparison = async (req, res) => {
  try {
    // TODO: Replace with real competitor data
    const dummyComparison = [
      {
        stationName: 'Our Station',
        petrolPrice: 102.50,
        dieselPrice: 89.30,
        distance: 0,
        isOurStation: true
      },
      {
        stationName: 'Station A',
        petrolPrice: 103.20,
        dieselPrice: 90.10,
        distance: 0.5,
        isOurStation: false
      },
      {
        stationName: 'Station B',
        petrolPrice: 101.90,
        dieselPrice: 88.70,
        distance: 1.2,
        isOurStation: false
      }
    ];

    res.json({
      success: true,
      data: dummyComparison
    });
  } catch (error) {
    console.error('Error fetching price comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch price comparison'
    });
  }
};
