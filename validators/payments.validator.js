const { body } = require('express-validator');

const createCheckoutRules = [
  body('doctorId').isMongoId().withMessage('Invalid doctor ID'),
  body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
  body('appointmentTime').trim().notEmpty().withMessage('Appointment time is required'),
  body('symptoms').optional().trim(),
];

const confirmSessionRules = [
  body('sessionId')
    .trim()
    .notEmpty()
    .withMessage('Checkout session ID is required')
    .matches(/^cs_/)
    .withMessage('Invalid checkout session ID'),
];

module.exports = {
  createCheckoutRules,
  confirmSessionRules,
};
