const express = require('express');
const {
  getDashboardSummary,
  getBatchStatistics,
  getFeeStatistics
} = require('../controllers/dashboardController');

const router = express.Router();

// Get main dashboard summary
router.get('/', getDashboardSummary);

// Get batch statistics
router.get('/batches', getBatchStatistics);

// Get fee statistics
router.get('/fees', getFeeStatistics);

module.exports = router;
