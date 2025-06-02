
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Upload = sequelize.define('Upload', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  blobUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('processing', 'success', 'failed'),
    allowNull: false,
    defaultValue: 'processing'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  litres: {
    type: DataTypes.DECIMAL(8, 3),
    allowNull: false,
    defaultValue: 0
  },
  fuelType: {
    type: DataTypes.ENUM('Petrol', 'Diesel'),
    allowNull: false,
    defaultValue: 'Petrol'
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  ocrData: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'uploads',
  timestamps: true
});

module.exports = Upload;
