
const { Sale, OCRReading, Station, User, Pump, Nozzle } = require('../models');
const { Op } = require('sequelize');

/**
 * Multi-tenant sales controller with station-based isolation
 */
class MultiTenantSalesController {
  
  /**
   * Get sales data for user's station
   */
  static async getSales(req, res) {
    try {
      console.log('📊 Fetching sales for user:', req.userId);
      const { startDate, endDate, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

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

      let whereClause = {
        stationId: user.stationId
      };

      // Add date filtering
      if (startDate && endDate) {
        whereClause.saleDate = {
          [Op.between]: [startDate, endDate]
        };
      } else if (startDate) {
        whereClause.saleDate = {
          [Op.gte]: startDate
        };
      } else if (endDate) {
        whereClause.saleDate = {
          [Op.lte]: endDate
        };
      }

      const sales = await Sale.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Pump,
            as: 'pump',
            attributes: ['name', 'pumpSno', 'location']
          },
          {
            model: User,
            as: 'createdByUser',
            attributes: ['name', 'email']
          }
        ],
        offset: parseInt(offset),
        limit: parseInt(limit),
        order: [['saleDate', 'DESC'], ['createdAt', 'DESC']]
      });

      console.log('✅ Found', sales.count, 'sales for station:', user.station.name);

      res.json({
        success: true,
        data: sales.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: sales.count,
          totalPages: Math.ceil(sales.count / limit)
        }
      });

    } catch (error) {
      console.error('❌ Get sales error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sales'
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
}

module.exports = MultiTenantSalesController;
