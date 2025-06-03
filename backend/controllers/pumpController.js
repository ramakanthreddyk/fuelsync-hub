
const { Pump, Nozzle } = require('../models');

// Get all pumps
exports.getPumps = async (req, res) => {
  try {
    // TODO: Replace with real DB query - returning dummy pumps for frontend dev
    const dummyPumps = [
      {
        id: '1',
        name: 'Pump 1',
        status: 'active',
        location: 'North Side',
        lastMaintenanceDate: '2024-05-15T00:00:00Z',
        totalSalesToday: 12450,
        nozzles: [
          {
            id: '1',
            number: 1,
            fuelType: 'Petrol',
            status: 'active',
            pumpId: '1'
          },
          {
            id: '2',
            number: 2,
            fuelType: 'Diesel',
            status: 'active',
            pumpId: '1'
          }
        ]
      },
      {
        id: '2',
        name: 'Pump 2',
        status: 'active',
        location: 'South Side',
        lastMaintenanceDate: '2024-05-20T00:00:00Z',
        totalSalesToday: 8930,
        nozzles: [
          {
            id: '3',
            number: 1,
            fuelType: 'Petrol',
            status: 'active',
            pumpId: '2'
          },
          {
            id: '4',
            number: 2,
            fuelType: 'Diesel',
            status: 'maintenance',
            pumpId: '2'
          }
        ]
      },
      {
        id: '3',
        name: 'Pump 3',
        status: 'maintenance',
        location: 'East Side',
        lastMaintenanceDate: '2024-05-10T00:00:00Z',
        totalSalesToday: 0,
        nozzles: [
          {
            id: '5',
            number: 1,
            fuelType: 'Petrol',
            status: 'inactive',
            pumpId: '3'
          },
          {
            id: '6',
            number: 2,
            fuelType: 'Diesel',
            status: 'inactive',
            pumpId: '3'
          }
        ]
      }
    ];

    res.json({
      success: true,
      data: dummyPumps
    });
  } catch (error) {
    console.error('Error fetching pumps:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pumps data'
    });
  }
};

// Update pump status
exports.updatePumpStatus = async (req, res) => {
  try {
    const { pumpId } = req.params;
    const { status } = req.body;

    // TODO: Replace with real DB update
    console.log(`Updating pump ${pumpId} status to ${status}`);

    // Return updated pump data
    const updatedPump = {
      id: pumpId,
      status: status,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: updatedPump,
      message: 'Pump status updated successfully'
    });
  } catch (error) {
    console.error('Error updating pump status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update pump status'
    });
  }
};

// Update nozzle fuel type
exports.updateNozzleFuelType = async (req, res) => {
  try {
    const { nozzleId } = req.params;
    const { fuelType } = req.body;

    // TODO: Replace with real DB update
    console.log(`Updating nozzle ${nozzleId} fuel type to ${fuelType}`);

    res.json({
      success: true,
      message: 'Nozzle fuel type updated successfully'
    });
  } catch (error) {
    console.error('Error updating nozzle fuel type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update nozzle fuel type'
    });
  }
};

// Get pump performance metrics
exports.getPumpMetrics = async (req, res) => {
  try {
    const { pumpId } = req.params;
    const { period = '24h' } = req.query;

    // TODO: Replace with real DB aggregation
    const dummyMetrics = {
      pumpId: pumpId,
      period: period,
      totalSales: 15670,
      totalLitres: 456,
      transactions: 34,
      uptime: 98.5,
      efficiency: 94.2,
      hourlyData: [
        { hour: '00:00', sales: 890, litres: 25 },
        { hour: '01:00', sales: 1200, litres: 34 },
        { hour: '02:00', sales: 1560, litres: 42 }
      ]
    };

    res.json({
      success: true,
      data: dummyMetrics
    });
  } catch (error) {
    console.error('Error fetching pump metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pump metrics'
    });
  }
};
