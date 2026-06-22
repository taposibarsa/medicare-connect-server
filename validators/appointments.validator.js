const { body, param } = require('express-validator');

const createAppointmentRules = [
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').trim().notEmpty().withMessage('Appointment time is required'),
  body('symptoms').optional().trim(),
  body('paymentStatus')
    .equals('paid')
    .withMessage('Payment must be completed before booking (paymentStatus: paid)'),
];

const rescheduleAppointmentRules = [
  param('id').isMongoId().withMessage('Invalid appointment ID'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').trim().notEmpty().withMessage('Appointment time is required'),
];

const appointmentIdParam = [param('id').isMongoId().withMessage('Invalid appointment ID')];

module.exports = {
  createAppointmentRules,
  rescheduleAppointmentRules,
  appointmentIdParam,
};
