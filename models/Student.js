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
  grade: {
    type: Number,
    required: [true, 'Please specify student grade'],
    min: 1,
    max: 10
  },
  batch: {
    type: String,
    required: [true, 'Please add a batch'],
    trim: true
  },
  // For 9th-10th: yearly fees, For 8th and below: monthly fees
  feeStructure: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: function() {
      return this.grade >= 9 ? 'yearly' : 'monthly';
    }
  },
  monthlyFees: {
    type: Number,
    default: 0,
    min: [0, 'Fees cannot be negative']
  },
  yearlyFees: {
    type: Number,
    default: 0,
    min: [0, 'Fees cannot be negative']
  },
  totalFees: {
    type: Number,
    default: function() {
      return this.feeStructure === 'yearly' ? this.yearlyFees : this.monthlyFees * 12;
    },
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

// Update fee structure when grade changes
StudentSchema.pre('save', function(next) {
  // Set fee structure based on grade
  this.feeStructure = this.grade >= 9 ? 'yearly' : 'monthly';
  
  // Calculate total fees based on fee structure
  this.totalFees = this.feeStructure === 'yearly' 
    ? this.yearlyFees 
    : this.monthlyFees * 12;
  
  // Ensure balance fees is calculated correctly
  this.balanceFees = this.totalFees - this.paidFees;
  
  next();
});

// Handle updates
StudentSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  const grade = update.grade || update.$set?.grade;
  
  // If grade is updated, update fee structure
  if (grade !== undefined) {
    const feeStructure = grade >= 9 ? 'yearly' : 'monthly';
    
    if (!update.$set) update.$set = {};
    update.$set.feeStructure = feeStructure;
    
    // Recalculate total fees if needed
    if (feeStructure === 'yearly' && update.$set.yearlyFees !== undefined) {
      update.$set.totalFees = update.$set.yearlyFees;
    } else if (feeStructure === 'monthly' && update.$set.monthlyFees !== undefined) {
      update.$set.totalFees = update.$set.monthlyFees * 12;
    }
  }

  // Always ensure balance is calculated
  if (update.$set?.totalFees !== undefined || update.$set?.paidFees !== undefined) {
    const totalFees = update.$set?.totalFees;
    const paidFees = update.$set?.paidFees;
    
    if (totalFees !== undefined && paidFees !== undefined) {
      update.$set.balanceFees = totalFees - paidFees;
    }
  }
  
  next();
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
