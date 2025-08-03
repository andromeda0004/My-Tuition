const express = require('express');
const {
  getAttendanceReport,
  getFeeReport,
  exportAttendanceReport,
  exportFeeReport
} = require('../controllers/reportController');

const router = express.Router();

// Attendance reports
router.get('/attendance', getAttendanceReport);
router.get('/attendance/export', exportAttendanceReport);

// Fee reports
router.get('/fees', getFeeReport);
router.get('/fees/export', exportFeeReport);

module.exports = router;
