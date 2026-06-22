const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getDoctorByUserId } = require('../utils/doctorHelpers');

const populateOptions = [
  { path: 'doctorId', select: 'doctorName specialization' },
  { path: 'patientId', select: 'name email' },
  { path: 'appointmentId', select: 'appointmentDate appointmentTime appointmentStatus' },
];

const getPrescriptionFilter = async (user) => {
  if (user.role === 'admin') {
    return {};
  }

  if (user.role === 'patient') {
    return { patientId: user.id };
  }

  if (user.role === 'doctor') {
    const doctor = await getDoctorByUserId(user.id);

    if (!doctor) {
      throw new AppError('Doctor profile not found', 404);
    }

    return { doctorId: doctor._id };
  }

  throw new AppError('Forbidden — insufficient permissions', 403);
};

const listPrescriptions = asyncHandler(async (req, res) => {
  const filter = await getPrescriptionFilter(req.user);
  const data = await Prescription.find(filter)
    .populate(populateOptions)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data,
  });
});

const createPrescription = asyncHandler(async (req, res) => {
  const doctor = await getDoctorByUserId(req.user.id);

  if (!doctor) {
    throw new AppError('Doctor profile not found', 404);
  }

  const { patientId, appointmentId, diagnosis, medications, notes } = req.body;

  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.doctorId.toString() !== doctor._id.toString()) {
    throw new AppError('Forbidden — appointment does not belong to you', 403);
  }

  if (appointment.appointmentStatus !== 'completed') {
    throw new AppError('Prescriptions can only be created for completed appointments', 400);
  }

  if (appointment.patientId.toString() !== patientId) {
    throw new AppError('Patient ID does not match the appointment', 400);
  }

  const prescription = await Prescription.create({
    doctorId: doctor._id,
    patientId,
    appointmentId,
    diagnosis,
    medications,
    notes: notes || '',
  });

  const populated = await Prescription.findById(prescription._id).populate(populateOptions);

  res.status(201).json({
    success: true,
    data: populated,
    message: 'Prescription created successfully',
  });
});

const updatePrescription = asyncHandler(async (req, res) => {
  const doctor = await getDoctorByUserId(req.user.id);

  if (!doctor) {
    throw new AppError('Doctor profile not found', 404);
  }

  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    throw new AppError('Prescription not found', 404);
  }

  if (prescription.doctorId.toString() !== doctor._id.toString()) {
    throw new AppError('Forbidden — you can only update your own prescriptions', 403);
  }

  const allowedFields = ['diagnosis', 'medications', 'notes'];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      prescription[field] = req.body[field];
    }
  });

  await prescription.save();

  const populated = await Prescription.findById(prescription._id).populate(populateOptions);

  res.status(200).json({
    success: true,
    data: populated,
    message: 'Prescription updated successfully',
  });
});

module.exports = {
  listPrescriptions,
  createPrescription,
  updatePrescription,
};
