const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');

const normalizeToUtcDay = (dateInput) => {
  const d = new Date(dateInput);
  const start = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
  const end = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999)
  );
  return { start, end };
};

const isSlotTaken = async (doctorId, appointmentDate, appointmentTime, excludeId = null) => {
  const { start, end } = normalizeToUtcDay(appointmentDate);

  const filter = {
    doctorId,
    appointmentDate: { $gte: start, $lte: end },
    appointmentTime,
    appointmentStatus: { $nin: ['cancelled', 'rejected'] },
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const existing = await Appointment.findOne(filter);
  return Boolean(existing);
};

module.exports = {
  normalizeToUtcDay,
  isSlotTaken,
};
