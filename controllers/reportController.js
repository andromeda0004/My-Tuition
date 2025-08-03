const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const FeeTransaction = require('../models/FeeTransaction');

// @desc    Generate attendance report by date range
// @route   GET /api/reports/attendance
exports.getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, batch } = req.query;
    
    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide startDate and endDate"
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }
    
    // Add batch filter to query if provided
    let studentQuery = {};
    if (batch) {
      studentQuery.batch = batch;
    }
    
    // Get all relevant students
    const students = await Student.find(studentQuery).select('_id name batch');
    
    // Get attendance records for the date range
    const attendanceRecords = await Attendance.find({
      date: { $gte: start, $lte: end }
    }).populate('studentId', 'name batch');
    
    // Format for report
    const report = {
      reportType: 'Attendance',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      batch: batch || 'All',
      totalStudents: students.length,
      attendanceByDate: {},
      studentSummary: {}
    };
    
    // Process attendance records
    attendanceRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      const studentId = record.studentId?._id?.toString();
      
      if (!studentId) return;
      
      // Initialize date in report if not exists
      if (!report.attendanceByDate[dateKey]) {
        report.attendanceByDate[dateKey] = {
          present: 0,
          absent: 0,
          total: 0
        };
      }
      
      // Initialize student in summary if not exists
      if (!report.studentSummary[studentId]) {
        report.studentSummary[studentId] = {
          name: record.studentId.name,
          batch: record.studentId.batch,
          presentDays: 0,
          absentDays: 0,
          totalDays: 0,
          attendancePercentage: 0
        };
      }
      
      // Update counters
      if (record.status) {
        report.attendanceByDate[dateKey].present++;
        report.studentSummary[studentId].presentDays++;
      } else {
        report.attendanceByDate[dateKey].absent++;
        report.studentSummary[studentId].absentDays++;
      }
      
      report.attendanceByDate[dateKey].total++;
      report.studentSummary[studentId].totalDays++;
    });
    
    // Calculate attendance percentages for each student
    Object.keys(report.studentSummary).forEach(studentId => {
      const student = report.studentSummary[studentId];
      student.attendancePercentage = student.totalDays > 0 
        ? ((student.presentDays / student.totalDays) * 100).toFixed(2)
        : 0;
    });
    
    // Convert studentSummary from object to array for easier consumption
    report.studentSummary = Object.values(report.studentSummary)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    // Convert attendanceByDate from object to array for easier sorting
    report.attendanceByDate = Object.entries(report.attendanceByDate)
      .map(([date, stats]) => ({
        date,
        ...stats,
        attendanceRate: stats.total > 0 
          ? ((stats.present / stats.total) * 100).toFixed(2)
          : 0
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating attendance report:', error);
    res.status(500).json({
      success: false,
      message: "Failed to generate attendance report",
      error: error.message
    });
  }
};

// @desc    Generate fee report by date range
// @route   GET /api/reports/fees
exports.getFeeReport = async (req, res) => {
  try {
    const { startDate, endDate, batch } = req.query;
    
    // Validate date parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide startDate and endDate"
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }
    
    // Add batch filter if provided
    let studentQuery = {};
    if (batch) {
      studentQuery.batch = batch;
    }
    
    // Get all students matching the criteria
    const students = await Student.find(studentQuery);
    
    // Get fee transactions for the date range
    let feeQuery = {
      paymentDate: { $gte: start, $lte: end }
    };
    
    if (batch) {
      // Get student IDs from the batch
      const studentIds = students.map(student => student._id);
      feeQuery.studentId = { $in: studentIds };
    }
    
    const feeTransactions = await FeeTransaction.find(feeQuery)
      .populate('studentId', 'name batch');
    
    // Format for report
    const report = {
      reportType: 'Fees',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      batch: batch || 'All',
      summary: {
        totalCollection: 0,
        transactionCount: feeTransactions.length,
        paymentModes: {}
      },
      dailyCollection: {},
      studentCollection: {},
      transactions: []
    };
    
    // Process fee transactions
    feeTransactions.forEach(transaction => {
      const dateKey = transaction.paymentDate.toISOString().split('T')[0];
      const studentId = transaction.studentId?._id?.toString();
      
      if (!studentId) return;
      
      // Add to total collection
      report.summary.totalCollection += transaction.amountPaid;
      
      // Track payment modes
      if (!report.summary.paymentModes[transaction.paymentMode]) {
        report.summary.paymentModes[transaction.paymentMode] = {
          count: 0,
          total: 0
        };
      }
      report.summary.paymentModes[transaction.paymentMode].count++;
      report.summary.paymentModes[transaction.paymentMode].total += transaction.amountPaid;
      
      // Track daily collection
      if (!report.dailyCollection[dateKey]) {
        report.dailyCollection[dateKey] = {
          total: 0,
          count: 0
        };
      }
      report.dailyCollection[dateKey].total += transaction.amountPaid;
      report.dailyCollection[dateKey].count++;
      
      // Track student-wise collection
      if (!report.studentCollection[studentId]) {
        report.studentCollection[studentId] = {
          name: transaction.studentId.name,
          batch: transaction.studentId.batch,
          totalPaid: 0,
          transactionCount: 0
        };
      }
      report.studentCollection[studentId].totalPaid += transaction.amountPaid;
      report.studentCollection[studentId].transactionCount++;
      
      // Add transaction details
      report.transactions.push({
        id: transaction._id,
        studentName: transaction.studentId.name,
        amount: transaction.amountPaid,
        date: dateKey,
        paymentMode: transaction.paymentMode,
        notes: transaction.notes || ''
      });
    });
    
    // Convert objects to arrays for easier consumption
    report.summary.paymentModes = Object.entries(report.summary.paymentModes)
      .map(([mode, stats]) => ({
        mode,
        ...stats,
        percentage: ((stats.total / report.summary.totalCollection) * 100).toFixed(2)
      }))
      .sort((a, b) => b.total - a.total);
    
    report.dailyCollection = Object.entries(report.dailyCollection)
      .map(([date, stats]) => ({
        date,
        ...stats
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    report.studentCollection = Object.values(report.studentCollection)
      .sort((a, b) => b.totalPaid - a.totalPaid);
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating fee report:', error);
    res.status(500).json({
      success: false,
      message: "Failed to generate fee report",
      error: error.message
    });
  }
};

// @desc    Export attendance report as CSV
// @route   GET /api/reports/attendance/export
exports.exportAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, batch, format = 'csv' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide startDate and endDate"
      });
    }
    
    // Get attendance data (reusing logic from getAttendanceReport)
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Add batch filter to query if provided
    let studentQuery = {};
    if (batch) {
      studentQuery.batch = batch;
    }
    
    const students = await Student.find(studentQuery).select('_id name batch');
    
    // Get attendance for date range
    const attendanceRecords = await Attendance.find({
      date: { $gte: start, $lte: end }
    }).populate('studentId', 'name batch');
    
    // Process data for export
    let csvData = [];
    let studentAttendance = {};
    
    // Group attendance by student
    attendanceRecords.forEach(record => {
      const studentId = record.studentId?._id?.toString();
      if (!studentId) return;
      
      const dateKey = record.date.toISOString().split('T')[0];
      
      if (!studentAttendance[studentId]) {
        studentAttendance[studentId] = {
          name: record.studentId.name,
          batch: record.studentId.batch,
          dates: {}
        };
      }
      
      studentAttendance[studentId].dates[dateKey] = record.status ? 'Present' : 'Absent';
    });
    
    // Get unique dates
    const uniqueDates = [...new Set(attendanceRecords.map(record => 
      record.date.toISOString().split('T')[0]))].sort();
    
    // Create CSV header
    const header = ['Student Name', 'Batch', ...uniqueDates, 'Present Days', 'Absent Days', 'Percentage'];
    csvData.push(header);
    
    // Add data rows
    Object.values(studentAttendance).forEach(student => {
      const row = [student.name, student.batch];
      
      let presentCount = 0;
      let absentCount = 0;
      
      uniqueDates.forEach(date => {
        const status = student.dates[date] || 'N/A';
        row.push(status);
        
        if (status === 'Present') presentCount++;
        if (status === 'Absent') absentCount++;
      });
      
      const totalDays = presentCount + absentCount;
      const percentage = totalDays > 0 ? ((presentCount / totalDays) * 100).toFixed(2) : '0.00';
      
      row.push(presentCount, absentCount, `${percentage}%`);
      csvData.push(row);
    });
    
    // Convert to CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    // Set response headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_report_${startDate}_to_${endDate}.csv`);
    
    // Send CSV data
    res.status(200).send(csvString);
  } catch (error) {
    console.error('Error exporting attendance report:', error);
    res.status(500).json({
      success: false,
      message: "Failed to export attendance report",
      error: error.message
    });
  }
};

// @desc    Export fee report as CSV
// @route   GET /api/reports/fees/export
exports.exportFeeReport = async (req, res) => {
  try {
    const { startDate, endDate, batch, format = 'csv' } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide startDate and endDate"
      });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Build query for fees based on parameters
    let feeQuery = {
      paymentDate: { $gte: start, $lte: end }
    };
    
    if (batch) {
      const students = await Student.find({ batch }).select('_id');
      const studentIds = students.map(s => s._id);
      feeQuery.studentId = { $in: studentIds };
    }
    
    // Get fee transactions
    const feeTransactions = await FeeTransaction.find(feeQuery)
      .populate('studentId', 'name batch')
      .sort({ paymentDate: 1 });
    
    // Prepare CSV data
    let csvData = [];
    
    // Create header row
    const header = ['Date', 'Student Name', 'Batch', 'Amount', 'Payment Mode', 'Notes'];
    csvData.push(header);
    
    // Add transaction rows
    feeTransactions.forEach(transaction => {
      if (!transaction.studentId) return;
      
      const row = [
        transaction.paymentDate.toISOString().split('T')[0],
        transaction.studentId.name,
        transaction.studentId.batch,
        transaction.amountPaid,
        transaction.paymentMode,
        transaction.notes || ''
      ];
      
      csvData.push(row);
    });
    
    // Add summary row
    const totalAmount = feeTransactions.reduce((sum, t) => sum + t.amountPaid, 0);
    csvData.push(['', '', 'TOTAL', totalAmount, '', '']);
    
    // Convert to CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    // Set response headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=fee_report_${startDate}_to_${endDate}.csv`);
    
    // Send CSV data
    res.status(200).send(csvString);
  } catch (error) {
    console.error('Error exporting fee report:', error);
    res.status(500).json({
      success: false,
      message: "Failed to export fee report",
      error: error.message
    });
  }
};
