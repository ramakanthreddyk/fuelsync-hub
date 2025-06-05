
const { OCRReading, Sale, FuelPrice, Pump, Nozzle } = require('../models/multiTenantIndex');
const { Op } = require('sequelize');

/**
 * Multi-tenant sales calculation service
 * Handles cumulative volume-based sales calculation with station isolation
 */
class MultiTenantSalesService {
  
  /**
   * Process OCR readings and calculate sales for a specific station
   */
  static async processOCRReadingsForSales(stationId, ocrReadings) {
    console.log(`🧮 Processing ${ocrReadings.length} OCR readings for station ${stationId}`);
    
    const salesResults = [];
    
    for (const reading of ocrReadings) {
      try {
        const salesData = await this.calculateSaleFromReading(reading);
        
        if (salesData && salesData.litresSold > 0) {
          const sale = await Sale.create({
            stationId: reading.stationId,
            pumpId: reading.pumpId,
            nozzleId: reading.nozzleId,
            readingId: reading.id,
            previousReadingId: salesData.previousReadingId,
            fuelType: reading.fuelType,
            litresSold: salesData.litresSold,
            pricePerLitre: salesData.pricePerLitre,
            totalAmount: salesData.totalAmount,
            saleDate: reading.readingDate,
            shift: this.determineShift(reading.readingTime),
            createdBy: reading.enteredBy
          });
          
          salesResults.push(sale);
          console.log(`✅ Created sale: ${salesData.litresSold}L @ ₹${salesData.pricePerLitre} = ₹${salesData.totalAmount}`);
        } else {
          console.log(`⚠️ No sales calculated for reading ${reading.id} (likely first reading or zero volume)`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing reading ${reading.id}:`, error);
      }
    }
    
    console.log(`🎯 Processed ${salesResults.length} sales from ${ocrReadings.length} readings`);
    return salesResults;
  }
  
  /**
   * Calculate sale data from a single OCR reading
   */
  static async calculateSaleFromReading(reading) {
    console.log(`🔍 Calculating sales for reading ${reading.id} - Pump ${reading.pumpSno}, Nozzle ${reading.nozzleId}`);
    
    // Find the most recent previous reading for the same pump + nozzle + station
    const previousReading = await OCRReading.findOne({
      where: {
        stationId: reading.stationId,
        pumpSno: reading.pumpSno,
        nozzleId: reading.nozzleId,
        readingDate: {
          [Op.lt]: reading.readingDate
        }
      },
      order: [['readingDate', 'DESC'], ['readingTime', 'DESC'], ['createdAt', 'DESC']]
    });
    
    if (!previousReading) {
      console.log(`📊 No previous reading found for Pump ${reading.pumpSno}, Nozzle ${reading.nozzleId} - this might be the first reading`);
      return null;
    }
    
    console.log(`📈 Previous reading: ${previousReading.cumulativeVolume}L on ${previousReading.readingDate}`);
    console.log(`📈 Current reading: ${reading.cumulativeVolume}L on ${reading.readingDate}`);
    
    // Calculate litres sold
    const litresSold = parseFloat(reading.cumulativeVolume) - parseFloat(previousReading.cumulativeVolume);
    
    if (litresSold < 0) {
      console.warn(`⚠️ Negative litres calculated (${litresSold}L) - possible reading error or meter reset`);
      return null;
    }
    
    if (litresSold === 0) {
      console.log(`📊 Zero litres sold - no sales to record`);
      return null;
    }
    
    // Get current fuel price for this station and fuel type
    const fuelPrice = await FuelPrice.findOne({
      where: {
        stationId: reading.stationId,
        fuelType: reading.fuelType,
        validFrom: {
          [Op.lte]: new Date(reading.readingDate)
        }
      },
      order: [['validFrom', 'DESC']]
    });
    
    if (!fuelPrice) {
      console.error(`❌ No fuel price found for ${reading.fuelType} at station ${reading.stationId}`);
      throw new Error(`No fuel price configured for ${reading.fuelType}`);
    }
    
    const pricePerLitre = parseFloat(fuelPrice.price);
    const totalAmount = parseFloat((litresSold * pricePerLitre).toFixed(2));
    
    console.log(`💰 Sales calculation: ${litresSold}L × ₹${pricePerLitre} = ₹${totalAmount}`);
    
    return {
      litresSold,
      pricePerLitre,
      totalAmount,
      previousReadingId: previousReading.id
    };
  }
  
  /**
   * Determine shift based on reading time
   */
  static determineShift(readingTime) {
    if (!readingTime) return 'morning';
    
    const hour = parseInt(readingTime.split(':')[0]);
    
    if (hour >= 6 && hour < 14) return 'morning';
    if (hour >= 14 && hour < 22) return 'afternoon';
    return 'night';
  }
  
  /**
   * Get sales summary for a station within date range
   */
  static async getStationSalesSummary(stationId, startDate, endDate) {
    console.log(`📊 Getting sales summary for station ${stationId} from ${startDate} to ${endDate}`);
    
    const sales = await Sale.findAll({
      where: {
        stationId,
        saleDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Pump,
          as: 'pump',
          attributes: ['pumpSno', 'name']
        }
      ]
    });
    
    const summary = sales.reduce((acc, sale) => {
      const fuelKey = sale.fuelType;
      
      if (!acc[fuelKey]) {
        acc[fuelKey] = {
          totalLitres: 0,
          totalRevenue: 0,
          totalTransactions: 0
        };
      }
      
      acc[fuelKey].totalLitres += parseFloat(sale.litresSold);
      acc[fuelKey].totalRevenue += parseFloat(sale.totalAmount);
      acc[fuelKey].totalTransactions += 1;
      
      acc.grandTotal = acc.grandTotal || { totalLitres: 0, totalRevenue: 0, totalTransactions: 0 };
      acc.grandTotal.totalLitres += parseFloat(sale.litresSold);
      acc.grandTotal.totalRevenue += parseFloat(sale.totalAmount);
      acc.grandTotal.totalTransactions += 1;
      
      return acc;
    }, {});
    
    console.log(`✅ Sales summary calculated for ${sales.length} transactions`);
    return summary;
  }
  
  /**
   * Get pump performance metrics for a station
   */
  static async getPumpPerformance(stationId, date) {
    console.log(`🏭 Getting pump performance for station ${stationId} on ${date}`);
    
    const pumps = await Pump.findAll({
      where: { stationId },
      include: [
        {
          model: Sale,
          as: 'sales',
          where: {
            saleDate: date
          },
          required: false
        },
        {
          model: Nozzle,
          as: 'nozzles',
          where: { status: 'active' },
          required: false
        }
      ]
    });
    
    const performance = pumps.map(pump => {
      const pumpSales = pump.sales || [];
      const totalRevenue = pumpSales.reduce((sum, sale) => sum + parseFloat(sale.totalAmount), 0);
      const totalLitres = pumpSales.reduce((sum, sale) => sum + parseFloat(sale.litresSold), 0);
      
      return {
        pumpId: pump.id,
        pumpSno: pump.pumpSno,
        name: pump.name,
        status: pump.status,
        totalRevenue,
        totalLitres,
        totalTransactions: pumpSales.length,
        activeNozzles: pump.nozzles ? pump.nozzles.length : 0
      };
    });
    
    console.log(`✅ Pump performance calculated for ${pumps.length} pumps`);
    return performance;
  }
  
  /**
   * Auto-create pump and nozzles from OCR data if they don't exist
   */
  static async ensurePumpAndNozzlesExist(stationId, pumpSno, nozzleIds, enteredBy) {
    console.log(`🔧 Ensuring pump ${pumpSno} and nozzles exist for station ${stationId}`);
    
    // Find or create pump
    let pump = await Pump.findOne({
      where: { stationId, pumpSno }
    });
    
    if (!pump) {
      console.log(`🆕 Creating new pump ${pumpSno} for station ${stationId}`);
      pump = await Pump.create({
        stationId,
        pumpSno,
        name: `Pump ${pumpSno}`,
        location: 'Auto-created from OCR',
        status: 'active',
        installationDate: new Date()
      });
    }
    
    // Ensure nozzles exist
    const existingNozzles = await Nozzle.findAll({
      where: { pumpId: pump.id }
    });
    
    const existingNozzleIds = existingNozzles.map(n => n.nozzleId);
    
    // Default fuel type mapping (can be customized per station)
    const defaultFuelTypeMap = {
      1: 'petrol',
      2: 'petrol', 
      3: 'diesel',
      4: 'diesel',
      5: 'petrol',
      6: 'petrol',
      7: 'diesel',
      8: 'diesel'
    };
    
    for (const nozzleId of nozzleIds) {
      if (!existingNozzleIds.includes(nozzleId)) {
        console.log(`🆕 Creating new nozzle ${nozzleId} for pump ${pump.id}`);
        await Nozzle.create({
          pumpId: pump.id,
          nozzleId,
          fuelType: defaultFuelTypeMap[nozzleId] || 'petrol',
          status: 'active',
          maxFlowRate: 35.0
        });
      }
    }
    
    return pump;
  }
}

module.exports = MultiTenantSalesService;
