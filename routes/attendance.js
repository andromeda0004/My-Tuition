const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');

// Enhanced endpoint for date-wise attendance
router.get('/date-wise', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required' });
    }

    // Create start and end of day to query all records for that day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Query using date range instead of exact match
    const attendanceData = await Attendance.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).populate('studentId', 'name roll_number class phone batch')
      .lean();

    // Transform data if needed
    const formattedData = attendanceData.map(record => ({
      ...record,
      date: new Date(record.date).toISOString().split('T')[0], // Format date consistently
      studentName: record.studentId ? record.studentId.name : 'Unknown',
      rollNumber: record.studentId ? record.studentId.roll_number : 'N/A',
      class: record.studentId ? record.studentId.class : 'N/A',
      batch: record.studentId ? record.studentId.batch : 'N/A',
      phone: record.studentId ? record.studentId.phone : 'N/A'
    }));

    return res.status(200).json({
      success: true,
      count: formattedData.length,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching date-wise attendance:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while retrieving attendance data',
      error: error.message
    });
  }
});

module.exports = router;