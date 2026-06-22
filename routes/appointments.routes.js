const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const appointmentsController = require('../controllers/appointments.controller');

const router = express.Router();

router.use(verifyJWT);

router.get('/', appointmentsController.listAppointments);
router.get('/:id', appointmentsController.getAppointmentById);
router.post('/', authorizeRoles('patient'), appointmentsController.createAppointment);
router.patch(
  '/:id/reschedule',
  authorizeRoles('patient'),
  appointmentsController.rescheduleAppointment
);
router.patch(
  '/:id/cancel',
  authorizeRoles('patient'),
  appointmentsController.cancelAppointment
);
router.patch(
  '/:id/accept',
  authorizeRoles('doctor'),
  appointmentsController.acceptAppointment
);
router.patch(
  '/:id/reject',
  authorizeRoles('doctor'),
  appointmentsController.rejectAppointment
);
router.patch(
  '/:id/complete',
  authorizeRoles('doctor'),
  appointmentsController.completeAppointment
);

module.exports = router;
