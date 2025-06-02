
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Nozzle = sequelize.define('Nozzle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  pumpId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'pumps',
      key: 'id'
    }
  },
  number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10
    }
  },
  fuelType: {
    type: DataTypes.ENUM('Petrol', 'Diesel'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active'
  }
}, {
  tableName: 'nozzles',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['pumpId', 'number']
    }
  ]
});

module.exports = Nozzle;
