
const { Sale, User, Pump } = require('../models');

// Get sales with role-based filtering
exports.getSales = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // Apply date filters if provided
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[require('sequelize').Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[require('sequelize').Op.lte] = new Date(endDate);
    }

    // Role-based access control
    if (req.user.role === 'Employee') {
      whereClause.userId = req.userId;
    } else if (req.user.role === 'Pump Owner') {
      // Get sales from own station only
      const stationUsers = await User.findAll({
        where: { stationId: req.user.stationId },
        attributes: ['id']
      });
      whereClause.userId = stationUsers.map(u => u.id);
    }
    // Super Admin sees all sales

    const sales = await Sale.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'user', attributes: ['name'] },
        { model: Pump, as: 'pump', attributes: ['name'] }
      ],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['createdAt', 'DESC']]
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
    console.error('Error fetching sales:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales data'
    });
  }
};

// Get daily summary with role-based filtering
exports.getDailySummary = async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    
    let whereClause = {
      createdAt: {
        [require('sequelize').Op.gte]: startDate,
        [require('sequelize').Op.lt]: endDate
      }
    };

    // Role-based access control
    if (req.user.role === 'Employee') {
      whereClause.userId = req.userId;
    } else if (req.user.role === 'Pump Owner') {
      const stationUsers = await User.findAll({
        where: { stationId: req.user.stationId },
        attributes: ['id']
      });
      whereClause.userId = stationUsers.map(u => u.id);
    }

    const sales = await Sale.findAll({
      where: whereClause,
      attributes: ['fuelType', 'totalAmount', 'litres']
    });

    if (sales.length === 0) {
      return res.json({
        success: true,
        data: {
          date,
          totalRevenue: 0,
          totalLitres: 0,
          totalTransactions: 0,
          fuelTypeBreakdown: {
            petrol: { revenue: 0, litres: 0, transactions: 0 },
            diesel: { revenue: 0, litres: 0, transactions: 0 }
          },
          hourlyBreakdown: []
        }
      });
    }

    const summary = sales.reduce((acc, sale) => {
      acc.totalRevenue += parseFloat(sale.totalAmount);
      acc.totalLitres += parseFloat(sale.litres);
      acc.totalTransactions += 1;

      const fuelKey = sale.fuelType.toLowerCase();
      if (!acc.fuelTypeBreakdown[fuelKey]) {
        acc.fuelTypeBreakdown[fuelKey] = { revenue: 0, litres: 0, transactions: 0 };
      }
      
      acc.fuelTypeBreakdown[fuelKey].revenue += parseFloat(sale.totalAmount);
      acc.fuelTypeBreakdown[fuelKey].litres += parseFloat(sale.litres);
      acc.fuelTypeBreakdown[fuelKey].transactions += 1;

      return acc;
    }, {
      date,
      totalRevenue: 0,
      totalLitres: 0,
      totalTransactions: 0,
      fuelTypeBreakdown: {
        petrol: { revenue: 0, litres: 0, transactions: 0 },
        diesel: { revenue: 0, litres: 0, transactions: 0 }
      },
      hourlyBreakdown: [] // TODO: Implement hourly breakdown from DB
    });

    res.json({
      success: true,
      data: summary
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
    
    let whereClause = {
      shift,
      createdAt: {
        [require('sequelize').Op.gte]: new Date(date),
        [require('sequelize').Op.lt]: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
      }
    };

    // Role-based access control
    if (req.user.role === 'Employee') {
      whereClause.userId = req.userId;
    } else if (req.user.role === 'Pump Owner') {
      const stationUsers = await User.findAll({
        where: { stationId: req.user.stationId },
        attributes: ['id']
      });
      whereClause.userId = stationUsers.map(u => u.id);
    }

    const sales = await Sale.findAll({ where: whereClause });

    const summary = sales.reduce((acc, sale) => {
      acc.revenue += parseFloat(sale.totalAmount);
      acc.litres += parseFloat(sale.litres);
      acc.transactions += 1;
      return acc;
    }, {
      date,
      shift,
      revenue: 0,
      litres: 0,
      transactions: 0,
      startTime: shift === 'morning' ? '06:00' : shift === 'afternoon' ? '14:00' : '22:00',
      endTime: shift === 'morning' ? '14:00' : shift === 'afternoon' ? '22:00' : '06:00'
    });

    res.json({
      success: true,
      data: summary
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
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    let whereClause = {
      createdAt: {
        [require('sequelize').Op.gte]: startDate,
        [require('sequelize').Op.lte]: endDate
      }
    };

    // Role-based access control
    if (req.user.role === 'Employee') {
      whereClause.userId = req.userId;
    } else if (req.user.role === 'Pump Owner') {
      const stationUsers = await User.findAll({
        where: { stationId: req.user.stationId },
        attributes: ['id']
      });
      whereClause.userId = stationUsers.map(u => u.id);
    }

    const sales = await Sale.findAll({
      where: whereClause,
      attributes: ['createdAt', 'totalAmount', 'litres'],
      order: [['createdAt', 'ASC']]
    });

    // Group sales by date
    const trends = sales.reduce((acc, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, litres: 0 };
      }
      acc[date].revenue += parseFloat(sale.totalAmount);
      acc[date].litres += parseFloat(sale.litres);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        period,
        data: Object.values(trends)
      }
    });
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales trends'
    });
  }
};
