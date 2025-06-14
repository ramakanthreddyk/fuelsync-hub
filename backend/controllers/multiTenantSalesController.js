const { Sale, OCRReading, Station, User, Pump, Nozzle } = require('../models');
const { Op } = require('sequelize');

// Main paginated/filterable list endpoint
exports.salesPageList = async (req, res) => {
  try {
    const {
      station_id,
      from,
      to,
      fuel_type,
      nozzle_id,
      pump_id,
      limit = 20,
      offset = 0
    } = req.query;

    // get user with station access
    const user = await User.findByPk(req.userId, {
      include: [{ model: Station, as: 'station' }]
    });

    // multi-tenant scope: superadmins, owners, employees
    let allowedStationIds = [];
    if (!user) {
      return res.status(401).json({ success: false, error: "Access denied" });
    }
    if (user.role === 'superadmin') {
      allowedStationIds = null; // all
    } else if (user.role === 'owner') {
      // owner: owns stations
      const stations = await Station.findAll({ where: { owner_id: user.id }, attributes: ['id'] });
      allowedStationIds = stations.map(s => s.id);
    } else {
      // employee: only own station
      allowedStationIds = user.stationId ? [user.stationId] : [];
    }

    // only allow querying permitted stations
    const queryStationId = parseInt(station_id);
    if (
      allowedStationIds &&
      (isNaN(queryStationId) || !allowedStationIds.includes(queryStationId))
    ) {
      return res.status(403).json({ success: false, error: "Not allowed to access this station's data" });
    }

    // Build where clause
    let where = {};
    if (allowedStationIds) {
      where.stationId = queryStationId;
    } else if (queryStationId) {
      where.stationId = queryStationId;
    }
    if (from) {
      where.saleDate = where.saleDate || {};
      where.saleDate[Op.gte] = from;
    }
    if (to) {
      where.saleDate = where.saleDate || {};
      where.saleDate[Op.lte] = to;
    }
    if (fuel_type) {
      where.fuelType = fuel_type.toUpperCase();
    }
    if (nozzle_id) {
      where.nozzleId = nozzle_id;
    }
    if (pump_id) {
      where.pumpId = pump_id;
    }

    // Perform query with paginated result
    const [total_count, sales] = await Promise.all([
      Sale.count({ where }),
      Sale.findAll({
        where,
        include: [
          {
            model: OCRReading,
            as: 'reading',
            attributes: ['source'],
          },
          {
            model: Pump,
            as: 'pump',
            attributes: ['pumpSno', 'name'],
          }
        ],
        order: [['saleDate', 'DESC'], ['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      })
    ]);

    // Compose list with source field ("ocr" | "manual" | "refill" | "tender")
    let result = sales.map(sale => {
      // derive source: from reading if exists, else "manual" if user entered, else fallback null
      let source = null;
      if (sale.reading && sale.reading.source) {
        source = sale.reading.source; // e.g. ocr/manual/tender/refill etc
      } else if (sale.isManualEntry) {
        source = "manual";
      } else {
        source = "ocr"; // fallback/default
      }

      return {
        id: sale.id,
        station_id: sale.stationId,
        pump_id: sale.pumpId,
        nozzle_id: sale.nozzleId,
        fuel_type: sale.fuelType,
        price_per_litre: sale.pricePerLitre,
        delta_volume_l: sale.litresSold,
        total_amount: sale.totalAmount,
        sale_date: sale.saleDate,
        shift: sale.shift,
        source: source,
        created_at: sale.createdAt,
        pump: sale.pump ? { pump_sno: sale.pump.pumpSno, name: sale.pump.name } : null
      };
    });

    res.json({
      success: true,
      data: result,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total_count
      }
    });
  } catch (err) {
    console.error('[Sales List Error]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch sales list' });
  }
};

// Sales summary endpoint
exports.salesSummary = async (req, res) => {
  try {
    const {
      station_id,
      from,
      to,
      fuel_type,
      nozzle_id,
      pump_id
    } = req.query;

    // get user with station access
    const user = await User.findByPk(req.userId, {
      include: [{ model: Station, as: 'station' }]
    });

    // multi-tenant scope: superadmins, owners, employees
    let allowedStationIds = [];
    if (!user) {
      return res.status(401).json({ success: false, error: "Access denied" });
    }
    if (user.role === 'superadmin') {
      allowedStationIds = null; // all
    } else if (user.role === 'owner') {
      // owner: owns stations
      const stations = await Station.findAll({ where: { owner_id: user.id }, attributes: ['id'] });
      allowedStationIds = stations.map(s => s.id);
    } else {
      allowedStationIds = user.stationId ? [user.stationId] : [];
    }

    // only allow querying permitted stations
    const queryStationId = parseInt(station_id);
    if (
      allowedStationIds &&
      (isNaN(queryStationId) || !allowedStationIds.includes(queryStationId))
    ) {
      return res.status(403).json({ success: false, error: "Not allowed to access this station's data" });
    }

    // Build where clause
    let where = {};
    if (allowedStationIds) {
      where.stationId = queryStationId;
    } else if (queryStationId) {
      where.stationId = queryStationId;
    }
    if (from) {
      where.saleDate = where.saleDate || {};
      where.saleDate[Op.gte] = from;
    }
    if (to) {
      where.saleDate = where.saleDate || {};
      where.saleDate[Op.lte] = to;
    }
    if (fuel_type) {
      where.fuelType = fuel_type.toUpperCase();
    }
    if (nozzle_id) {
      where.nozzleId = nozzle_id;
    }
    if (pump_id) {
      where.pumpId = pump_id;
    }

    // Query all matches (summary)
    const sales = await Sale.findAll({
      where,
      include: [
        {
          model: OCRReading,
          as: 'reading',
          attributes: ['source'],
        }
      ]
    });

    // Calculate summary
    let total_sales = 0;
    let count_by_source = {};
    let volume_by_fuel_type = {};

    for (const sale of sales) {
      total_sales += parseFloat(sale.totalAmount);
      // Source
      let source = sale.reading && sale.reading.source ? sale.reading.source : (sale.isManualEntry ? "manual" : "ocr");
      count_by_source[source] = (count_by_source[source] || 0) + 1;
      // Fuel
      let fuelKey = (sale.fuelType || '').toUpperCase();
      if (!volume_by_fuel_type[fuelKey]) volume_by_fuel_type[fuelKey] = 0;
      volume_by_fuel_type[fuelKey] += parseFloat(sale.litresSold);
    }

    res.json({
      success: true,
      data: {
        total_sales,
        count_by_source,
        volume_by_fuel_type,
        total_count: sales.length
      }
    });
  } catch (err) {
    console.error('[Sales Summary Error]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
};

/**
 * Multi-tenant sales controller with station-based isolation
 */
class MultiTenantSalesController {
  
  /**
   * Get sales trends for dashboard charts
   */
  static async getSalesTrends(req, res) {
    try {
      console.log('📈 Fetching sales trends for user:', req.userId);
      const { days = 7 } = req.query;

      // Get user with station info
      const user = await User.findByPk(req.userId, {
        include: [{ model: Station, as: 'station' }]
      });

      if (!user || !user.station) {
        return res.status(400).json({
          success: false,
          error: 'User must be assigned to a station'
        });
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(days));

      const sales = await Sale.findAll({
        where: {
          stationId: user.stationId,
          saleDate: {
            [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
          }
        },
        order: [['saleDate', 'ASC']]
      });

      // Group by date
      const trendsMap = {};
      sales.forEach(sale => {
        const date = sale.saleDate;
        if (!trendsMap[date]) {
          trendsMap[date] = {
            date,
            revenue: 0,
            litres: 0,
            transactions: 0
          };
        }
        trendsMap[date].revenue += parseFloat(sale.totalAmount);
        trendsMap[date].litres += parseFloat(sale.litresSold);
        trendsMap[date].transactions += 1;
      });

      const trends = Object.values(trendsMap);

      console.log('✅ Sales trends calculated for', days, 'days');

      res.json({
        success: true,
        data: trends
      });

    } catch (error) {
      console.error('❌ Get sales trends error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sales trends'
      });
    }
  }

  /**
   * Get daily summary for user's station
   */
  static async getDailySummary(req, res) {
    try {
      console.log('📊 Fetching daily summary for user:', req.userId);
      const { date } = req.params;

      if (!date) {
        return res.status(400).json({
          success: false,
          error: 'Date parameter is required'
        });
      }

      // Get user with station info
      const user = await User.findByPk(req.userId, {
        include: [{ model: Station, as: 'station' }]
      });

      if (!user || !user.station) {
        return res.status(400).json({
          success: false,
          error: 'User must be assigned to a station'
        });
      }

      // Get sales for the specific date
      const sales = await Sale.findAll({
        where: {
          stationId: user.stationId,
          saleDate: date
        },
        include: [
          {
            model: Pump,
            as: 'pump',
            attributes: ['name', 'pumpSno']
          }
        ]
      });

      // Calculate summary
      const summary = {
        date,
        totalRevenue: 0,
        totalLitres: 0,
        totalTransactions: sales.length,
        fuelTypeBreakdown: {
          petrol: { litres: 0, revenue: 0, transactions: 0 },
          diesel: { litres: 0, revenue: 0, transactions: 0 }
        }
      };

      sales.forEach(sale => {
        const litres = parseFloat(sale.litresSold);
        const amount = parseFloat(sale.totalAmount);
        const fuelType = sale.fuelType.toLowerCase();

        summary.totalLitres += litres;
        summary.totalRevenue += amount;

        if (summary.fuelTypeBreakdown[fuelType]) {
          summary.fuelTypeBreakdown[fuelType].litres += litres;
          summary.fuelTypeBreakdown[fuelType].revenue += amount;
          summary.fuelTypeBreakdown[fuelType].transactions += 1;
        }
      });

      console.log('✅ Daily summary calculated for', date, '- Revenue:', summary.totalRevenue);

      res.json({
        success: true,
        data: summary
      });

    } catch (error) {
      console.error('❌ Get daily summary error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch daily summary'
      });
    }
  }
}

module.exports = MultiTenantSalesController;
