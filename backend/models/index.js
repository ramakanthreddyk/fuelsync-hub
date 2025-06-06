
const { sequelize } = require('../config/database');

// Import all models
const User = require('./MultiTenantUser');
const Station = require('./Station');
const Plan = require('./Plan');
const Pump = require('./MultiTenantPump');
const Nozzle = require('./MultiTenantNozzle');
const FuelPrice = require('./MultiTenantFuelPrice');
const Upload = require('./Upload');
const OCRReading = require('./MultiTenantOCRReading');
const Sale = require('./MultiTenantSale');

// Define associations
User.belongsTo(Station, { foreignKey: 'stationId', as: 'station' });
Station.hasMany(User, { foreignKey: 'stationId', as: 'users' });

User.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });
Plan.hasMany(User, { foreignKey: 'planId', as: 'users' });

Station.hasMany(Pump, { foreignKey: 'stationId', as: 'pumps' });
Pump.belongsTo(Station, { foreignKey: 'stationId', as: 'station' });

Pump.hasMany(Nozzle, { foreignKey: 'pumpId', as: 'nozzles' });
Nozzle.belongsTo(Pump, { foreignKey: 'pumpId', as: 'pump' });

Station.hasMany(FuelPrice, { foreignKey: 'stationId', as: 'fuelPrices' });
FuelPrice.belongsTo(Station, { foreignKey: 'stationId', as: 'station' });

User.hasMany(Upload, { foreignKey: 'userId', as: 'uploads' });
Upload.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Station.hasMany(Upload, { foreignKey: 'stationId', as: 'uploads' });
Upload.belongsTo(Station, { foreignKey: 'stationId', as: 'station' });

Upload.hasMany(OCRReading, { foreignKey: 'uploadId', as: 'ocrReadings' });
OCRReading.belongsTo(Upload, { foreignKey: 'uploadId', as: 'upload' });

Station.hasMany(OCRReading, { foreignKey: 'stationId', as: 'ocrReadings' });
OCRReading.belongsTo(Station, { foreignKey: 'stationId', as: 'station' });

Pump.hasMany(OCRReading, { foreignKey: 'pumpId', as: 'ocrReadings' });
OCRReading.belongsTo(Pump, { foreignKey: 'pumpId', as: 'pump' });

User.hasMany(OCRReading, { foreignKey: 'enteredBy', as: 'enteredReadings' });
OCRReading.belongsTo(User, { foreignKey: 'enteredBy', as: 'enteredByUser' });

Station.hasMany(Sale, { foreignKey: 'stationId', as: 'sales' });
Sale.belongsTo(Station, { foreignKey: 'stationId', as: 'station' });

Pump.hasMany(Sale, { foreignKey: 'pumpId', as: 'sales' });
Sale.belongsTo(Pump, { foreignKey: 'pumpId', as: 'pump' });

OCRReading.hasMany(Sale, { foreignKey: 'readingId', as: 'sales' });
Sale.belongsTo(OCRReading, { foreignKey: 'readingId', as: 'reading' });

User.hasMany(Sale, { foreignKey: 'createdBy', as: 'createdSales' });
Sale.belongsTo(User, { foreignKey: 'createdBy', as: 'createdByUser' });

module.exports = {
  sequelize,
  User,
  Station,
  Plan,
  Pump,
  Nozzle,
  FuelPrice,
  Upload,
  OCRReading,
  Sale
};
