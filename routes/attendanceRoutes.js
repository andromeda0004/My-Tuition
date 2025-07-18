const express = require('express');
const {
  markAttendance,
  getAttendanceByDate,
  getStudentAttendance,
  updateAttendance,
  deleteAttendance,
  deleteAllAttendance  // Add this import
} = require('../controllers/attendanceController');

const router = express.Router();

// Base attendance routes
router.route('/')
  .post(markAttendance);

// Route for deleting all attendance records
router.route('/all')
  .delete(deleteAllAttendance);

// Date-specific attendance
router.route('/date/:date')
  .get(getAttendanceByDate);

// Student-specific attendance
router.route('/student/:id')
  .get(getStudentAttendance);

// Individual attendance record operations
router.route('/:id')
  .put(updateAttendance)
  .delete(deleteAttendance); // Make sure deleteAttendance is defined in controller

module.exports = router;