const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment ID is required'],
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than 0'],
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: 'payments',
  }
);

paymentSchema.index({ patientId: 1 });
paymentSchema.index({ doctorId: 1 });
paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ transactionId: 1 }, { unique: true });

module.exports = mongoose.model('Payment', paymentSchema);
