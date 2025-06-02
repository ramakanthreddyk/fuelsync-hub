const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Nozzle = sequelize.define('Nozzle', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  pump_id: {
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
  fuel_type: {  // Match DB column name (optional, for clarity)
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
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['pump_id', 'number']  // ✅ This is the correct field name
    }
  ]
});

module.exports = Nozzle;
