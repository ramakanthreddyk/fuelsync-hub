
const express = require('express');
const MultiTenantSalesController = require('../controllers/multiTenantSalesController');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get sales for user's station
router.get('/', MultiTenantSalesController.getSales);

// Get daily summary
router.get('/daily/:date', MultiTenantSalesController.getDailySummary);

// Get sales trends
router.get('/trends', MultiTenantSalesController.getSalesTrends);

module.exports = router;
