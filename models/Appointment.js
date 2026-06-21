const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
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
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    appointmentTime: {
      type: String,
      required: [true, 'Appointment time is required'],
      trim: true,
    },
    appointmentStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending',
    },
    symptoms: {
      type: String,
      default: '',
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid',
    },
  },
  {
    timestamps: true,
    collection: 'appointments',
  }
);

appointmentSchema.index({ patientId: 1, doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ doctorId: 1, appointmentStatus: 1 });
appointmentSchema.index({ patientId: 1, appointmentStatus: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
