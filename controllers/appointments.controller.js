const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { getDoctorByUserId } = require('../utils/doctorHelpers');
const { isSlotTaken } = require('../utils/appointmentHelpers');

const populateOptions = [
  { path: 'patientId', select: 'name email photo' },
  { path: 'doctorId', select: 'doctorName specialization profileImage consultationFee' },
];

const getAppointmentFilter = async (user) => {
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

const assertAppointmentAccess = async (appointment, user) => {
  if (user.role === 'admin') {
    return;
  }

  if (user.role === 'patient' && appointment.patientId.toString() === user.id) {
    return;
  }

  if (user.role === 'doctor') {
    const doctor = await getDoctorByUserId(user.id);

    if (doctor && appointment.doctorId.toString() === doctor._id.toString()) {
      return;
    }
  }

  throw new AppError('Forbidden — you do not have access to this appointment', 403);
};

const listAppointments = asyncHandler(async (req, res) => {
  const filter = await getAppointmentFilter(req.user);
  const data = await Appointment.find(filter)
    .populate(populateOptions)
    .sort({ appointmentDate: -1, createdAt: -1 });

  res.status(200).json({
    success: true,
    data,
  });
});

const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id).populate(populateOptions);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  await assertAppointmentAccess(appointment, req.user);

  res.status(200).json({
    success: true,
    data: appointment,
  });
});

const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, appointmentDate, appointmentTime, symptoms, paymentStatus } = req.body;

  const doctor = await Doctor.findById(doctorId);

  if (!doctor || doctor.verificationStatus !== 'verified') {
    throw new AppError('Doctor not found or not verified', 404);
  }

  if (paymentStatus !== 'paid') {
    throw new AppError('Payment must be completed before booking (paymentStatus: paid)', 400);
  }

  const slotTaken = await isSlotTaken(doctorId, appointmentDate, appointmentTime);

  if (slotTaken) {
    throw new AppError('This time slot is already booked', 409);
  }

  const appointment = await Appointment.create({
    patientId: req.user.id,
    doctorId,
    appointmentDate,
    appointmentTime,
    symptoms: symptoms || '',
    paymentStatus: 'paid',
    appointmentStatus: 'pending',
  });

  const populated = await Appointment.findById(appointment._id).populate(populateOptions);

  res.status(201).json({
    success: true,
    data: populated,
    message: 'Appointment booked successfully',
  });
});

const rescheduleAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.patientId.toString() !== req.user.id) {
    throw new AppError('Forbidden — you can only reschedule your own appointments', 403);
  }

  if (!['pending', 'accepted'].includes(appointment.appointmentStatus)) {
    throw new AppError('Only pending or accepted appointments can be rescheduled', 400);
  }

  const { appointmentDate, appointmentTime } = req.body;

  const slotTaken = await isSlotTaken(
    appointment.doctorId,
    appointmentDate,
    appointmentTime,
    appointment._id
  );

  if (slotTaken) {
    throw new AppError('This time slot is already booked', 409);
  }

  appointment.appointmentDate = appointmentDate;
  appointment.appointmentTime = appointmentTime;
  await appointment.save();

  const populated = await Appointment.findById(appointment._id).populate(populateOptions);

  res.status(200).json({
    success: true,
    data: populated,
    message: 'Appointment rescheduled successfully',
  });
});

const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.patientId.toString() !== req.user.id) {
    throw new AppError('Forbidden — you can only cancel your own appointments', 403);
  }

  if (appointment.appointmentStatus === 'completed') {
    throw new AppError('Completed appointments cannot be cancelled', 400);
  }

  appointment.appointmentStatus = 'cancelled';
  await appointment.save();

  const populated = await Appointment.findById(appointment._id).populate(populateOptions);

  res.status(200).json({
    success: true,
    data: populated,
    message: 'Appointment cancelled successfully',
  });
});

const acceptAppointment = asyncHandler(async (req, res) => {
  const doctor = await getDoctorByUserId(req.user.id);

  if (!doctor) {
    throw new AppError('Doctor profile not found', 404);
  }

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.doctorId.toString() !== doctor._id.toString()) {
    throw new AppError('Forbidden — this appointment is not assigned to you', 403);
  }

  if (appointment.appointmentStatus !== 'pending') {
    throw new AppError('Only pending appointments can be accepted', 400);
  }

  appointment.appointmentStatus = 'accepted';
  await appointment.save();

  const populated = await Appointment.findById(appointment._id).populate(populateOptions);

  res.status(200).json({
    success: true,
    data: populated,
    message: 'Appointment accepted',
  });
});

const rejectAppointment = asyncHandler(async (req, res) => {
  const doctor = await getDoctorByUserId(req.user.id);

  if (!doctor) {
    throw new AppError('Doctor profile not found', 404);
  }

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.doctorId.toString() !== doctor._id.toString()) {
    throw new AppError('Forbidden — this appointment is not assigned to you', 403);
  }

  if (appointment.appointmentStatus !== 'pending') {
    throw new AppError('Only pending appointments can be rejected', 400);
  }

  appointment.appointmentStatus = 'rejected';
  await appointment.save();

  const populated = await Appointment.findById(appointment._id).populate(populateOptions);

  res.status(200).json({
    success: true,
    data: populated,
    message: 'Appointment rejected',
  });
});

const completeAppointment = asyncHandler(async (req, res) => {
  const doctor = await getDoctorByUserId(req.user.id);

  if (!doctor) {
    throw new AppError('Doctor profile not found', 404);
  }

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    throw new AppError('Appointment not found', 404);
  }

  if (appointment.doctorId.toString() !== doctor._id.toString()) {
    throw new AppError('Forbidden — this appointment is not assigned to you', 403);
  }

  if (appointment.appointmentStatus !== 'accepted') {
    throw new AppError('Only accepted appointments can be marked completed', 400);
  }

  appointment.appointmentStatus = 'completed';
  await appointment.save();

  const populated = await Appointment.findById(appointment._id).populate(populateOptions);

  res.status(200).json({
    success: true,
    data: populated,
    message: 'Appointment marked as completed',
  });
});

module.exports = {
  listAppointments,
  getAppointmentById,
  createAppointment,
  rescheduleAppointment,
  cancelAppointment,
  acceptAppointment,
  rejectAppointment,
  completeAppointment,
};
