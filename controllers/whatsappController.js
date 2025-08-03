const Student = require('../models/Student');

// @desc    Generate WhatsApp reminder link for a specific student
// @route   GET /api/whatsapp/:studentId
exports.generateReminderLink = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Check if student has pending fees
    if (student.balanceFees <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Student has no pending fees'
      });
    }
    
    const whatsappLink = student.generateWhatsAppReminder();
    
    res.status(200).json({
      success: true,
      data: {
        studentName: student.name,
        pendingAmount: student.balanceFees,
        whatsappLink,
        message: `Dear Parent, this is a reminder that ${student.name} has pending fees of Rs.${student.balanceFees}. Please arrange to clear the dues at your earliest convenience. Thank you.`
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating WhatsApp reminder',
      error: error.message
    });
  }
};

// @desc    Get all students with pending fees and their WhatsApp links
// @route   GET /api/whatsapp/pending
exports.getAllPendingReminders = async (req, res) => {
  try {
    const students = await Student.find({ balanceFees: { $gt: 0 } })
      .select('name batch phone totalFees paidFees balanceFees');
    
    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students with pending fees found'
      });
    }
    
    const reminders = students.map(student => {
      const whatsappLink = student.generateWhatsAppReminder();
      return {
        _id: student._id,
        name: student.name,
        batch: student.batch,
        phone: student.phone,
        balanceFees: student.balanceFees,
        whatsappLink
      };
    });
    
    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating WhatsApp reminders',
      error: error.message
    });
  }
};

// @desc    Send custom WhatsApp message to a student/parent
// @route   POST /api/whatsapp/custom/:studentId
exports.sendCustomMessage = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a message'
      });
    }
    
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    
    // Format the phone number by removing any non-digit characters
    const formattedPhone = student.phone.replace(/\D/g, '');
    
    // Generate WhatsApp link with custom message
    const whatsappLink = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    
    res.status(200).json({
      success: true,
      data: {
        studentName: student.name,
        phone: student.phone,
        whatsappLink,
        message
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error generating custom WhatsApp message',
      error: error.message
    });
  }
};
