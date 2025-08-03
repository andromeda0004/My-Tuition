const FeeTransaction = require("../models/FeeTransaction");
const Student = require("../models/Student");
const mongoose = require("mongoose");

// @desc Record a fee payment
// @route POST /api/fees
exports.recordPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { studentId, amountPaid, paymentDate, paymentMode, notes } = req.body;
    
    // Validate student exists
    const student = await Student.findById(studentId).session(session);
    if (!student) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    
    // Create payment record
    const payment = await FeeTransaction.create([{
      studentId,
      amountPaid,
      paymentDate: paymentDate || Date.now(),
      paymentMode: paymentMode || 'cash',
      notes
    }], { session });
    
    // Update student's paid and balance fees
    student.paidFees += amountPaid;
    student.balanceFees = student.totalFees - student.paidFees;
    await student.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: {
        payment: payment[0],
        updatedStudent: {
          name: student.name,
          totalFees: student.totalFees,
          paidFees: student.paidFees,
          balanceFees: student.balanceFees
        }
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({
      success: false,
      message: "Error recording payment",
      error: error.message
    });
  }
};

// @desc Get all fee payments for a student
// @route GET /api/fees/student/:id
exports.getPaymentsByStudent = async (req, res) => {
  try {
    // Validate student exists
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }
    
    const payments = await FeeTransaction.find({ studentId: req.params.id })
      .sort({ paymentDate: -1 });
      
    res.json({
      success: true,
      count: payments.length,
      studentInfo: {
        name: student.name,
        totalFees: student.totalFees,
        paidFees: student.paidFees,
        balanceFees: student.balanceFees
      },
      data: payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving payment records",
      error: error.message
    });
  }
};

// @desc Get list of students with pending fees
// @route GET /api/fees/pending
exports.getPendingFees = async (req, res) => {
  try {
    const students = await Student.find({ balanceFees: { $gt: 0 } })
      .select('name batch phone totalFees paidFees balanceFees')
      .sort({ balanceFees: -1 });
    
    // Generate WhatsApp links for each student
    const studentsWithWhatsAppLinks = students.map(student => {
      const whatsappLink = student.generateWhatsAppReminder();
      return {
        _id: student._id,
        name: student.name,
        batch: student.batch,
        phone: student.phone,
        totalFees: student.totalFees,
        paidFees: student.paidFees,
        balanceFees: student.balanceFees,
        whatsappLink
      };
    });
    
    res.json({
      success: true,
      count: students.length,
      data: studentsWithWhatsAppLinks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving pending fees",
      error: error.message
    });
  }
};

// @desc Get summary of fee collection
// @route GET /api/fees/summary
exports.getFeesSummary = async (req, res) => {
  try {
    // Get total fees collected
    const totalFeesResult = await FeeTransaction.aggregate([
      { $group: { _id: null, total: { $sum: "$amountPaid" } } }
    ]);
    
    const totalFees = totalFeesResult.length > 0 ? totalFeesResult[0].total : 0;
    
    // Get recent transactions
    const recentTransactions = await FeeTransaction.find()
      .populate('studentId', 'name batch')
      .sort({ paymentDate: -1 })
      .limit(5);
    
    // Get payment mode distribution
    const paymentModeDistribution = await FeeTransaction.aggregate([
      { $group: { _id: "$paymentMode", total: { $sum: "$amountPaid" } } },
      { $sort: { total: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalFeesCollected: totalFees,
        recentTransactions,
        paymentModeDistribution
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving fee summary",
      error: error.message
    });
  }
};

// @desc Delete a fee payment
// @route DELETE /api/fees/:id
exports.deletePayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const payment = await FeeTransaction.findById(req.params.id).session(session);
    
    if (!payment) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Payment record not found"
      });
    }
    
    // Update student's paid and balance fees
    const student = await Student.findById(payment.studentId).session(session);
    if (student) {
      student.paidFees -= payment.amountPaid;
      student.balanceFees = student.totalFees - student.paidFees;
      await student.save({ session });
    }
    
    await payment.remove({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({
      success: true,
      message: "Payment record deleted successfully"
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({
      success: false,
      message: "Error deleting payment record",
      error: error.message
    });
  }
};
