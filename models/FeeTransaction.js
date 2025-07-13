const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeeTransactionSchema = new Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student reference is required']
  },
  amountPaid: {
    type: Number,
    required: [true, 'Please add amount paid'],
    min: [1, 'Amount must be at least 1']
  },
  paymentDate: {
    type: Date,
    required: [true, 'Please add payment date'],
    default: Date.now
  },
  paymentMode: {
    type: String,
    required: [true, 'Please specify payment mode'],
    enum: ['cash', 'UPI', 'bank', 'check', 'other']
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Create index for faster queries
FeeTransactionSchema.index({ studentId: 1, paymentDate: -1 });

module.exports = mongoose.model('FeeTransaction', FeeTransactionSchema);
