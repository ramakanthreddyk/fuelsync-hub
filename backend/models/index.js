
const { sequelize } = require('../config/database');
const Upload = require('./Upload');
const Sale = require('./Sale');
const Pump = require('./Pump');
const Nozzle = require('./Nozzle');
const FuelPrice = require('./FuelPrice');
const User = require('./user');
const Plan = require('./plan');

// Define associations
User.hasMany(Upload, { foreignKey: 'userId', as: 'uploads' });
Upload.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Sale, { foreignKey: 'userId', as: 'sales' });
Sale.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Pump.hasMany(Nozzle, { foreignKey: 'pumpId', as: 'nozzles' });
Nozzle.belongsTo(Pump, { foreignKey: 'pumpId', as: 'pump' });

Pump.hasMany(Sale, { foreignKey: 'pumpId', as: 'sales' });
Sale.belongsTo(Pump, { foreignKey: 'pumpId', as: 'pump' });

User.belongsTo(Plan, { foreignKey: 'planId', as: 'plan' });
Plan.hasMany(User, { foreignKey: 'planId', as: 'users' });

module.exports = {
  sequelize,
  User,
  Upload,
  Sale,
  Pump,
  Nozzle,
  FuelPrice,
  Plan
};
