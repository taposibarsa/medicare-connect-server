const Appointment = require('../models/Appointment');

const isSlotTaken = async (doctorId, appointmentDate, appointmentTime, excludeId = null) => {
  const filter = {
    doctorId,
    appointmentDate: new Date(appointmentDate),
    appointmentTime,
    appointmentStatus: { $nin: ['cancelled', 'rejected'] },
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const existing = await Appointment.findOne(filter);
  return Boolean(existing);
};

const canAccessAppointment = (appointment, user) => {
  if (user.role === 'admin') {
    return true;
  }

  if (user.role === 'patient' && appointment.patientId.toString() === user.id) {
    return true;
  }

  return false;
};

module.exports = {
  isSlotTaken,
  canAccessAppointment,
};
