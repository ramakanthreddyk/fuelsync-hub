// backend/config/sequelize.js

const { Sequelize } = require('sequelize');

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize({
  database: process.env.DB_NAME || 'fuelsync_db',
  username: process.env.DB_USER || 'fueladmin',
  password: process.env.DB_PASSWORD || '',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  
  dialectOptions: {
    ssl: {
      require: true, // Always enforce SSL, even in development (especially for Azure)
      rejectUnauthorized: false, // Accept self-signed certs in dev and Azure's cert in prod
    }
  },
  logging: process.env.DB_LOGGING === 'true' || isProduction ? false : console.log,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Connected to PostgreSQL database via Sequelize');
  })
  .catch((err) => {
    console.error('❌ Unable to connect to the database:', err);
  });

module.exports = { sequelize };
