
const User = require('./User');
const Upload = require('./Upload');
const Sale = require('./Sale');
const FuelPrice = require('./FuelPrice');
const Pump = require('./Pump');
const Nozzle = require('./Nozzle');
const Plan = require('./Plan');
const NozzleReading = require('./NozzleReading');

// Define associations
User.hasMany(Upload, { foreignKey: 'userId', as: 'uploads' });
Upload.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Sale, { foreignKey: 'userId', as: 'sales' });
Sale.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Pump.hasMany(Sale, { foreignKey: 'pumpId', as: 'sales' });
Sale.belongsTo(Pump, { foreignKey: 'pumpId', as: 'pump' });

Pump.hasMany(Nozzle, { foreignKey: 'pumpId', as: 'nozzles' });
Nozzle.belongsTo(Pump, { foreignKey: 'pumpId', as: 'pump' });

Upload.hasMany(Sale, { foreignKey: 'uploadId', as: 'sales' });
Sale.belongsTo(Upload, { foreignKey: 'uploadId', as: 'upload' });

User.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });
Plan.hasMany(User, { foreignKey: 'planId', as: 'users' });

// New associations for NozzleReading
User.hasMany(NozzleReading, { foreignKey: 'userId', as: 'nozzleReadings' });
NozzleReading.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Upload.hasMany(NozzleReading, { foreignKey: 'uploadId', as: 'nozzleReadings' });
NozzleReading.belongsTo(Upload, { foreignKey: 'uploadId', as: 'upload' });

module.exports = {
  User,
  Upload,
  Sale,
  FuelPrice,
  Pump,
  Nozzle,
  Plan,
  NozzleReading
};
