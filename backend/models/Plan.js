const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4, // Sequelize will use `gen_random_uuid()` under the hood in Postgres
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  uploadLimit: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 12, // This is important! Prevents NOT NULL errors on existing rows
    comment: 'Daily upload limit (12 for unlimited)' // 12 in comment before might be a typo
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
  timestamps: true
});

module.exports = Plan;
