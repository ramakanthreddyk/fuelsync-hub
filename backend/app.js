const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/uploads');
const nozzleReadingRoutes = require('./routes/nozzleReadings');
const salesRoutes = require('./routes/sales');
const multiTenantSalesRoutes = require('./routes/multiTenantSales');
const priceRoutes = require('./routes/prices');
const pumpRoutes = require('./routes/pumps');
const reportRoutes = require('./routes/reports');
const testRoutes = require('./routes/test');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080'], // Allow both Vite dev servers
  credentials: true, // If using cookies
}));

// Rate limiting
app.use('/api/', rateLimiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes with v1 prefix
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/nozzle-readings', nozzleReadingRoutes);
app.use('/api/v1/sales', multiTenantSalesRoutes); // Use multi-tenant sales
app.use('/api/v1/prices', priceRoutes);
app.use('/api/v1/pumps', pumpRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/test', testRoutes);

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'FuelSync API',
    version: '1.0.0'
  });
});

// API documentation endpoint
app.get('/api/v1/docs', (req, res) => {
  res.json({
    message: 'FuelSync API Documentation',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth/*',
      users: '/api/v1/users/*',
      uploads: '/api/v1/uploads/*',
      nozzle-readings: '/api/v1/nozzle-readings/*',
      sales: '/api/v1/sales/*',
      prices: '/api/v1/prices/*',
      pumps: '/api/v1/pumps/*',
      reports: '/api/v1/reports/*',
      test: '/api/v1/test/*'
    },
    documentation: 'See docs/api.md for detailed API documentation'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
