const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const FeeTransaction = require('../models/FeeTransaction');
const mongoose = require('mongoose');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard
exports.getDashboardSummary = async (req, res) => {
  try {
    // Get total students count
    const totalStudents = await Student.countDocuments();
    
    // Get students with pending fees (defaulters)
    const feeDefaulters = await Student.find({ balanceFees: { $gt: 0 } })
      .select('name batch phone balanceFees')
      .sort({ balanceFees: -1 })
      .limit(10);
      
    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get today's attendance records
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lt: tomorrow }
    }).populate('studentId', 'name batch');
    
    // Calculate absentees
    const absentees = todayAttendance
      .filter(record => record.status === false)
      .map(record => ({
        id: record._id,
        studentId: record.studentId._id,
        name: record.studentId.name,
        batch: record.studentId.batch
      }));
    
    // Calculate attendance rate
    const attendanceRate = todayAttendance.length > 0 
      ? (todayAttendance.filter(r => r.status === true).length / todayAttendance.length) * 100 
      : 0;
    
    // Get recent fee transactions
    const recentTransactions = await FeeTransaction.find()
      .populate('studentId', 'name batch')
      .sort({ paymentDate: -1 })
      .limit(5);
    
    // Get monthly fee collection (current month)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const monthlyCollection = await FeeTransaction.aggregate([
      { 
        $match: { 
          paymentDate: { $gte: startOfMonth, $lte: endOfMonth } 
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amountPaid" }
        }
      }
    ]);
    
    const monthlyTotal = monthlyCollection.length > 0 ? monthlyCollection[0].total : 0;
    
    // Get batch-wise student distribution
    const batchDistribution = await Student.aggregate([
      {
        $group: {
          _id: "$batch",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    // Return dashboard data
    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        feeDefaulters: {
          count: feeDefaulters.length,
          students: feeDefaulters
        },
        todayAttendance: {
          total: todayAttendance.length,
          present: todayAttendance.filter(r => r.status === true).length,
          absent: absentees.length,
          absentees,
          attendanceRate: parseFloat(attendanceRate.toFixed(2))
        },
        financials: {
          recentTransactions,
          monthlyCollection: monthlyTotal
        },
        batchDistribution
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving dashboard data',
      error: error.message
    });
  }
};

// @desc    Get detailed batch statistics
// @route   GET /api/dashboard/batches
exports.getBatchStatistics = async (req, res) => {
  try {
    const batches = await Student.aggregate([
      {
        $group: {
          _id: "$batch",
          studentCount: { $sum: 1 },
          totalFees: { $sum: "$totalFees" },
          collectedFees: { $sum: "$paidFees" },
          pendingFees: { $sum: "$balanceFees" }
        }
      },
      {
        $sort: { studentCount: -1 }
      }
    ]);
    
    res.status(200).json({
      success: true,
      count: batches.length,
      data: batches
    });
  } catch (error) {
    console.error('Error fetching batch statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving batch statistics',
      error: error.message
    });
  }
};

// @desc    Get fee collection statistics by date range
// @route   GET /api/dashboard/fees
exports.getFeeStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to current month if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    // Set time components for complete day coverage
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
    
    // Get daily fee collection in the range
    const dailyCollection = await FeeTransaction.aggregate([
      {
        $match: {
          paymentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paymentDate" }
          },
          total: { $sum: "$amountPaid" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id": 1 }
      }
    ]);
    
    // Get payment mode distribution
    const paymentModeStats = await FeeTransaction.aggregate([
      {
        $match: {
          paymentDate: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: "$paymentMode",
          total: { $sum: "$amountPaid" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);
    
    // Calculate overall statistics
    const totalAmount = dailyCollection.reduce((sum, day) => sum + day.total, 0);
    const totalTransactions = dailyCollection.reduce((sum, day) => sum + day.count, 0);
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          startDate: start,
          endDate: end,
          totalAmount,
          totalTransactions,
          averagePerTransaction: totalTransactions > 0 ? 
            parseFloat((totalAmount / totalTransactions).toFixed(2)) : 0
        },
        dailyCollection,
        paymentModeStats
      }
    });
  } catch (error) {
    console.error('Error fetching fee statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving fee statistics',
      error: error.message
    });
  }
};
