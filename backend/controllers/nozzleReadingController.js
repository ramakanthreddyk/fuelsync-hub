
const { NozzleReading, User } = require('../models');
const { processNozzleReadings } = require('../services/salesCalculationService');

const getNozzleReadings = async (req, res) => {
  try {
    const { page = 1, limit = 20, pumpSno, date } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    
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

    // Apply filters
    if (pumpSno) whereClause.pumpSno = pumpSno;
    if (date) whereClause.readingDate = date;

    const readings = await NozzleReading.findAndCountAll({
      where: whereClause,
      include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
      offset: parseInt(offset),
      limit: parseInt(limit),
      order: [['readingDate', 'DESC'], ['readingTime', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: readings.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: readings.count,
        totalPages: Math.ceil(readings.count / limit)
      }
    });
  } catch (error) {
    console.error('Get nozzle readings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nozzle readings'
    });
  }
};

const createManualReading = async (req, res) => {
  try {
    const { pumpSno, nozzleId, cumulativeVolume, readingDate, readingTime, fuelType } = req.body;

    if (!pumpSno || !nozzleId || !cumulativeVolume || !readingDate || !fuelType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: pumpSno, nozzleId, cumulativeVolume, readingDate, fuelType'
      });
    }

    // Check for duplicate reading
    const existingReading = await NozzleReading.findOne({
      where: {
        pumpSno,
        nozzleId,
        readingDate,
        readingTime: readingTime || null,
        isManualEntry: true
      }
    });

    if (existingReading) {
      return res.status(400).json({
        success: false,
        error: 'A manual reading for this pump, nozzle, and time already exists'
      });
    }

    // Create the manual reading
    const nozzleReading = await NozzleReading.create({
      userId: req.userId,
      pumpSno,
      nozzleId: parseInt(nozzleId),
      cumulativeVolume: parseFloat(cumulativeVolume),
      readingDate,
      readingTime: readingTime || null,
      fuelType,
      isManualEntry: true
    });

    // Process the reading to calculate sales
    const [processedReading] = await processNozzleReadings([nozzleReading]);

    res.status(201).json({
      success: true,
      data: processedReading
    });
  } catch (error) {
    console.error('Create manual reading error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create manual reading'
    });
  }
};

const updateNozzleReading = async (req, res) => {
  try {
    const { id } = req.params;
    const { cumulativeVolume, fuelType } = req.body;

    const reading = await NozzleReading.findOne({
      where: { id, userId: req.userId }
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        error: 'Nozzle reading not found'
      });
    }

    // Update the reading
    await reading.update({
      cumulativeVolume: parseFloat(cumulativeVolume),
      fuelType
    });

    // Recalculate sales for this reading
    const [processedReading] = await processNozzleReadings([reading]);

    res.json({
      success: true,
      data: processedReading
    });
  } catch (error) {
    console.error('Update nozzle reading error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update nozzle reading'
    });
  }
};

const deleteNozzleReading = async (req, res) => {
  try {
    const { id } = req.params;

    const reading = await NozzleReading.findOne({
      where: { id, userId: req.userId }
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        error: 'Nozzle reading not found'
      });
    }

    await reading.destroy();

    res.json({
      success: true,
      message: 'Nozzle reading deleted successfully'
    });
  } catch (error) {
    console.error('Delete nozzle reading error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete nozzle reading'
    });
  }
};

module.exports = {
  getNozzleReadings,
  createManualReading,
  updateNozzleReading,
  deleteNozzleReading
};
