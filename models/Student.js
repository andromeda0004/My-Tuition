const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudentSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    trim: true
  },
  batch: {
    type: String,
    required: [true, 'Please add a batch'],
    trim: true
  },
  totalFees: {
    type: Number,
    required: [true, 'Please add total fees'],
    min: [0, 'Fees cannot be negative']
  },
  paidFees: {
    type: Number,
    default: 0,
    min: [0, 'Paid fees cannot be negative']
  },
  balanceFees: {
    type: Number,
    default: function() {
      return this.totalFees - this.paidFees;
    },
    min: [0, 'Balance fees cannot be negative']
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting all attendance records
StudentSchema.virtual('attendanceRecords', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'studentId',
  justOne: false
});

// Virtual for getting all fee transactions
StudentSchema.virtual('feeTransactions', {
  ref: 'FeeTransaction',
  localField: '_id',
  foreignField: 'studentId',
  justOne: false
});

// Method to generate WhatsApp reminder
StudentSchema.methods.generateWhatsAppReminder = function() {
  const message = `Dear Parent, this is a reminder that ${this.name} has pending fees of Rs.${this.balanceFees}. Please arrange to clear the dues at your earliest convenience. Thank you.`;
  
  // Format the phone number by removing any non-digit characters
  const formattedPhone = this.phone.replace(/\D/g, '');
  
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

module.exports = mongoose.model('Student', StudentSchema);
