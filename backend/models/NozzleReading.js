
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NozzleReading = sequelize.define('NozzleReading', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  uploadId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'uploads',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  pumpSno: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nozzleId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cumulativeVolume: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false
  },
  readingDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  readingTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  fuelType: {
    type: DataTypes.ENUM('Petrol', 'Diesel'),
    allowNull: false
  },
  isManualEntry: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  litresSold: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: true
  },
  pricePerLitre: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  }
}, {
  tableName: 'nozzle_readings',
  timestamps: true,
  indexes: [
    {
      fields: ['pumpSno', 'nozzleId', 'readingDate'],
      name: 'idx_pump_nozzle_date'
    },
    {
      fields: ['userId']
    },
    {
      fields: ['uploadId']
    }
  ]
});

module.exports = NozzleReading;
