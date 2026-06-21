const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    doctorName: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    qualifications: {
      type: String,
      default: '',
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [1, 'Consultation fee must be greater than 0'],
    },
    hospitalName: {
      type: String,
      default: '',
      trim: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    availableDays: {
      type: [String],
      default: [],
    },
    availableSlots: {
      type: [String],
      default: [],
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
    collection: 'doctors',
  }
);

doctorSchema.index({ doctorName: 'text', specialization: 'text' });
doctorSchema.index({ verificationStatus: 1 });
doctorSchema.index({ userId: 1 });
doctorSchema.index({ consultationFee: 1 });
doctorSchema.index({ experience: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
