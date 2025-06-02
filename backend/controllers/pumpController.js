
const { Pump, Nozzle } = require('../models');

const getPumps = async (req, res) => {
  try {
    const pumps = await Pump.findAll({
      include: [
        {
          model: Nozzle,
          as: 'nozzles',
          order: [['number', 'ASC']]
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: pumps
    });
  } catch (error) {
    console.error('Get pumps error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const updatePumpStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be active, inactive, or maintenance'
      });
    }

    const pump = await Pump.findByPk(id);
    if (!pump) {
      return res.status(404).json({
        success: false,
        error: 'Pump not found'
      });
    }

    await pump.update({ status });

    res.json({
      success: true,
      data: pump
    });
  } catch (error) {
    console.error('Update pump status error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const updateNozzleFuelType = async (req, res) => {
  try {
    const { nozzleId } = req.params;
    const { fuelType } = req.body;

    if (!['Petrol', 'Diesel'].includes(fuelType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fuel type. Must be Petrol or Diesel'
      });
    }

    const nozzle = await Nozzle.findByPk(nozzleId);
    if (!nozzle) {
      return res.status(404).json({
        success: false,
        error: 'Nozzle not found'
      });
    }

    await nozzle.update({ fuelType });

    res.json({
      success: true,
      data: nozzle
    });
  } catch (error) {
    console.error('Update nozzle fuel type error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getPumps,
  updatePumpStatus,
  updateNozzleFuelType
};
