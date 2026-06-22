const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');
const appointmentsController = require('../controllers/appointments.controller');
const {
  createAppointmentRules,
  rescheduleAppointmentRules,
  appointmentIdParam,
} = require('../validators/appointments.validator');

const router = express.Router();

router.use(verifyJWT);

router.get('/', appointmentsController.listAppointments);
router.get('/:id', appointmentIdParam, validate, appointmentsController.getAppointmentById);
router.post(
  '/',
  authorizeRoles('patient'),
  createAppointmentRules,
  validate,
  appointmentsController.createAppointment
);
router.patch(
  '/:id/reschedule',
  authorizeRoles('patient'),
  rescheduleAppointmentRules,
  validate,
  appointmentsController.rescheduleAppointment
);
router.patch(
  '/:id/cancel',
  authorizeRoles('patient'),
  appointmentIdParam,
  validate,
  appointmentsController.cancelAppointment
);
router.patch(
  '/:id/accept',
  authorizeRoles('doctor'),
  appointmentIdParam,
  validate,
  appointmentsController.acceptAppointment
);
router.patch(
  '/:id/reject',
  authorizeRoles('doctor'),
  appointmentIdParam,
  validate,
  appointmentsController.rejectAppointment
);
router.patch(
  '/:id/complete',
  authorizeRoles('doctor'),
  appointmentIdParam,
  validate,
  appointmentsController.completeAppointment
);

module.exports = router;
