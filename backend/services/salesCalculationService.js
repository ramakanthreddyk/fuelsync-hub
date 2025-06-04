
const { NozzleReading, FuelPrice } = require('../models');
const { Op } = require('sequelize');

/**
 * Calculates litres sold and total amount for a nozzle reading
 * by comparing with the previous reading for the same pump and nozzle
 */
async function calculateSales(nozzleReading) {
  const { pumpSno, nozzleId, cumulativeVolume, readingDate, fuelType } = nozzleReading;

  // Find the previous reading for this pump and nozzle
  const previousReading = await NozzleReading.findOne({
    where: {
      pumpSno,
      nozzleId,
      readingDate: {
        [Op.lt]: readingDate
      }
    },
    order: [['readingDate', 'DESC'], ['createdAt', 'DESC']]
  });

  let litresSold = 0;
  let totalAmount = 0;
  let pricePerLitre = 0;

  if (previousReading) {
    litresSold = cumulativeVolume - previousReading.cumulativeVolume;
  } else {
    // If no previous reading, assume this is the first reading (no sales yet)
    litresSold = 0;
  }

  // Get fuel price for calculation
  const fuelPrice = await FuelPrice.findOne({
    where: { fuelType },
    order: [['updatedAt', 'DESC']]
  });

  if (fuelPrice && litresSold > 0) {
    pricePerLitre = parseFloat(fuelPrice.price);
    totalAmount = litresSold * pricePerLitre;
  }

  return {
    litresSold: Math.max(0, litresSold), // Ensure no negative sales
    pricePerLitre,
    totalAmount: Math.max(0, totalAmount)
  };
}

/**
 * Processes nozzle readings and updates them with calculated sales data
 */
async function processNozzleReadings(readings) {
  const processedReadings = [];

  for (const reading of readings) {
    const salesData = await calculateSales(reading);
    
    const updatedReading = await reading.update({
      litresSold: salesData.litresSold,
      pricePerLitre: salesData.pricePerLitre,
      totalAmount: salesData.totalAmount
    });

    processedReadings.push(updatedReading);
  }

  return processedReadings;
}

module.exports = {
  calculateSales,
  processNozzleReadings
};
