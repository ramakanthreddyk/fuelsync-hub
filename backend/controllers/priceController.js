
const { FuelPrice, User } = require('../models');

const getFuelPrices = async (req, res) => {
  try {
    const prices = await FuelPrice.findAll({
      include: [
        {
          model: User,
          as: 'updatedByUser',
          attributes: ['name']
        }
      ],
      order: [['fuelType', 'ASC']]
    });

    res.json({
      success: true,
      data: prices
    });
  } catch (error) {
    console.error('Get fuel prices error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const updateFuelPrice = async (req, res) => {
  try {
    const { fuelType, price } = req.body;

    if (!['Petrol', 'Diesel'].includes(fuelType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fuel type. Must be Petrol or Diesel'
      });
    }

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Price must be greater than 0'
      });
    }

    const [fuelPrice, created] = await FuelPrice.findOrCreate({
      where: { fuelType },
      defaults: {
        fuelType,
        price: parseFloat(price),
        updatedBy: req.userId
      }
    });

    if (!created) {
      await fuelPrice.update({
        price: parseFloat(price),
        updatedBy: req.userId
      });
    }

    res.json({
      success: true,
      data: fuelPrice
    });
  } catch (error) {
    console.error('Update fuel price error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = {
  getFuelPrices,
  updateFuelPrice
};
