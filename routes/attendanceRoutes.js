const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendanceByDate,
  getStudentAttendance,
  updateAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');

// Define routes
router.route('/')
  .post(markAttendance);

router.route('/date/:date')
  .get(getAttendanceByDate);

router.route('/student/:id')
  .get(getStudentAttendance);

router.route('/:id')
  .put(updateAttendance)
  .delete(deleteAttendance);

module.exports = router; // Make sure to export the router