const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const mongoose = require('mongoose');

// @desc Mark attendance for multiple students
// @route POST /api/attendance
exports.markAttendance = async (req, res) => {
  try {
    const { date, records } = req.body;
    
    // Validate request data
    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format. Please provide date and records array."
      });
    }

    // First, fetch all existing attendance records for this date to avoid duplicates
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Fetch existing attendance records for this date
    const existingRecords = await Attendance.find({
      date: { $gte: dayStart, $lte: dayEnd }
    });
    
    // Create a map of existing records for faster lookup
    const existingMap = {};
    existingRecords.forEach(record => {
      existingMap[record.studentId.toString()] = record._id;
    });
    
    // Process records - separate into updates and inserts
    const operations = [];
    
    for (const record of records) {
      if (!record.studentId) continue;
      
      // Parse the time if provided, otherwise use current time
      let attendanceTime;
      if (record.time) {
        const [hours, minutes] = record.time.split(':').map(Number);
        attendanceTime = new Date(date);
        attendanceTime.setHours(hours, minutes, 0, 0);
      } else {
        attendanceTime = new Date();
      }
      
      // Check if record exists for this student on this day
      const studentId = record.studentId.toString();
      
      if (existingMap[studentId]) {
        // Update existing record
        operations.push({
          updateOne: {
            filter: { _id: existingMap[studentId] },
            update: { 
              $set: { 
                status: record.status,
                date: attendanceTime 
              } 
            }
          }
        });
      } else {
        // Insert new record
        operations.push({
          insertOne: {
            document: {
              studentId: record.studentId,
              date: attendanceTime,
              status: record.status
            }
          }
        });
      }
    }
    
    if (operations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid attendance records to process"
      });
    }
    
    // Execute bulk operation
    const result = await Attendance.bulkWrite(operations);
    
    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        inserted: result.insertedCount
      }
    });
  } catch (error) {
    console.error('Attendance marking error:', error);
    res.status(500).json({
      success: false,
      message: "Error marking attendance",
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
      select: 'name grade batch phone'
    })
    .sort({ date: 1 }) // Sort by time
    .lean();
    
    // Format the response data with timestamp information
    const formattedAttendance = attendance.map(record => {
      // Get the full date with time
      const attendanceDate = new Date(record.date);
      
      return {
        attendanceId: record._id,
        date: attendanceDate.toISOString().split('T')[0],
        time: attendanceDate.toTimeString().split(' ')[0], // HH:MM:SS format
        timestamp: attendanceDate.toISOString(), // Full ISO timestamp
        formattedDateTime: attendanceDate.toLocaleString(), // Readable format
        status: record.status,
        student: record.studentId ? {
          id: record.studentId._id,
          name: record.studentId.name,
          grade: record.studentId.grade,
          batch: record.studentId.batch,
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

