const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const mongoose = require('mongoose');

// @desc    Mark attendance for students
// @route   POST /api/attendance
exports.markAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;
    
    // Validate request body
    if (!date || !records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "Please provide date and records array"
      });
    }
    
    // Ensure the date is treated as UTC midnight to avoid timezone issues
    const attendanceDate = new Date(`${date}T00:00:00.000Z`);
    
    // Process each attendance record using bulkWrite for efficiency
    const operations = records.map(record => ({
      updateOne: {
        filter: { 
          studentId: record.studentId, 
          date: attendanceDate 
        },
        update: { $set: { status: record.status } },
        upsert: true
      }
    }));

    const result = await Attendance.bulkWrite(operations);
    
    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      result: {
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
        total: records.length
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Failed to mark attendance", 
      error: error.message 
    });
  }
};

// @desc    Get attendance by date
// @route   GET /api/attendance/date/:date
exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    
    // Validate date parameter
    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date parameter is required"
      });
    }
    
    // Parse date properly as YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Please use YYYY-MM-DD"
      });
    }
    
    // Create date objects for the start and end of the day (in UTC)
    const startDate = new Date(`${date}T00:00:00.000Z`);
    const endDate = new Date(`${date}T23:59:59.999Z`);
    
    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date"
      });
    }
    
    // Find attendance records for the specified date
    const attendance = await Attendance.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate({
      path: 'studentId',
      select: 'name roll_number batch class phone'
    })
    .lean();
    
    // Format the response data
    const formattedAttendance = attendance.map(record => {
      return {
        attendanceId: record._id,
        date: new Date(record.date).toISOString().split('T')[0],
        status: record.status,
        student: record.studentId ? {
          id: record.studentId._id,
          name: record.studentId.name,
          rollNumber: record.studentId.roll_number,
          batch: record.studentId.batch,
          class: record.studentId.class,
          phone: record.studentId.phone
        } : 'Student not found'
      };
    });
    
    res.status(200).json({
      success: true,
      count: formattedAttendance.length,
      data: formattedAttendance
    });
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance data",
      error: error.message
    });
  }
};

// @desc    Get attendance records for a specific student
// @route   GET /api/attendance/student/:id
exports.getStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // Validate student ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID format"
      });
    }
    
    // Check if student exists
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    
    // Build the query
    const query = { studentId: id };
    
    // Add date range if provided
    if (startDate && endDate) {
      // Validate date formats
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format. Please use YYYY-MM-DD"
        });
      }
      
      const start = new Date(`${startDate}T00:00:00.000Z`);
      const end = new Date(`${endDate}T23:59:59.999Z`);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date values"
        });
      }
      
      query.date = {
        $gte: start,
        $lte: end
      };
    }
    
    // Fetch attendance records
    const attendanceRecords = await Attendance.find(query)
      .sort({ date: -1 })
      .lean();
    
    // Format the response data
    const formattedRecords = attendanceRecords.map(record => ({
      id: record._id,
      date: new Date(record.date).toISOString().split('T')[0],
      status: record.status
    }));
    
    res.status(200).json({
      success: true,
      count: formattedRecords.length,
      student: {
        id: student._id,
        name: student.name,
        rollNumber: student.roll_number,
        batch: student.batch,
        class: student.class
      },
      attendanceRecords: formattedRecords
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch student attendance",
      error: error.message
    });
  }
};

// @desc    Update an attendance record
// @route   PUT /api/attendance/:id
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (status === undefined) {
      return res.status(400).json({
        success: false,
        message: "Status field is required"
      });
    }
    
    const updated = await Attendance.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }
    
    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Failed to update attendance", 
      error: error.message 
    });
  }
};

// @desc    Delete an attendance record
// @route   DELETE /api/attendance/:id
exports.deleteAttendance = async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Attendance record not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Attendance record deleted successfully"
    });
  } catch (error) {
    console.error('Error deleting attendance record:', error);
    res.status(500).json({ 
      success: false,
      message: "Failed to delete attendance record", 
      error: error.message 
    });
  }
};

// @desc    Delete all attendance records
// @route   DELETE /api/attendance/all
exports.deleteAllAttendance = async (req, res) => {
  try {
    const result = await Attendance.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} attendance records`
    });
  } catch (error) {
    console.error('Error deleting all attendance records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete all attendance records',
      error: error.message
    });
  }
};
