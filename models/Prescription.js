const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Medication name is required'],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, 'Dosage is required'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Duration is required'],
      trim: true,
    },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor ID is required'],
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient ID is required'],
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment ID is required'],
    },
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
      trim: true,
    },
    medications: {
      type: [medicationSchema],
      default: [],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one medication is required',
      },
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    collection: 'prescriptions',
  }
);

prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ appointmentId: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
