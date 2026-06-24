const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const { isSlotTaken, normalizeToUtcDay } = require('./appointmentHelpers');

const createPaidAppointmentAndPayment = async ({
  patientId,
  doctorId,
  appointmentDate,
  appointmentTime,
  symptoms,
  amount,
  transactionId,
}) => {
  const existingPayment = await Payment.findOne({ transactionId });

  if (existingPayment) {
    const appointment = await Appointment.findById(existingPayment.appointmentId);
    return { appointment, payment: existingPayment, created: false };
  }

  const slotTaken = await isSlotTaken(doctorId, appointmentDate, appointmentTime);

  if (slotTaken) {
    const error = new Error('This time slot is already booked');
    error.code = 'SLOT_TAKEN';
    throw error;
  }

  const { start: normalizedDate } = normalizeToUtcDay(appointmentDate);

  const appointment = await Appointment.create({
    patientId,
    doctorId,
    appointmentDate: normalizedDate,
    appointmentTime,
    symptoms: symptoms || '',
    paymentStatus: 'paid',
    appointmentStatus: 'pending',
  });

  try {
    const payment = await Payment.create({
      appointmentId: appointment._id,
      patientId,
      doctorId,
      amount,
      transactionId,
      paymentDate: new Date(),
    });

    return { appointment, payment, created: true };
  } catch (err) {
    if (appointment?._id) {
      await Appointment.findByIdAndDelete(appointment._id);
    }
    throw err;
  }
};

module.exports = {
  createPaidAppointmentAndPayment,
};
