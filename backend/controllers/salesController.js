
const { Sale, Pump, User } = require('../models');
const { Op } = require('sequelize');

const getSales = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    
    // Filter by date range if provided
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const sales = await Sale.findAndCountAll({
      where: whereClause,
      include: [
        { model: Pump, as: 'pump', attributes: ['name'] },
        { model: User, as: 'user', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

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
    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const sales = await Sale.findAll({
      where: {
        createdAt: {
          [Op.gte]: targetDate,
          [Op.lt]: nextDate
        }
      }
    });

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
      summary.totalRevenue += parseFloat(sale.totalAmount);
      summary.totalLitres += parseFloat(sale.litres);

      const fuelKey = sale.fuelType.toLowerCase();
      if (summary.fuelTypeBreakdown[fuelKey]) {
        summary.fuelTypeBreakdown[fuelKey].litres += parseFloat(sale.litres);
        summary.fuelTypeBreakdown[fuelKey].revenue += parseFloat(sale.totalAmount);
        summary.fuelTypeBreakdown[fuelKey].transactions += 1;
      }
    });

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
