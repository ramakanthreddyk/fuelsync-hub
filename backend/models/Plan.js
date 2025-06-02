
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.ENUM('Free', 'Basic', 'Premium'),
    allowNull: false,
    unique: true
  },
  uploadLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'upload_limit'
  },
  features: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  price: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Plan;
