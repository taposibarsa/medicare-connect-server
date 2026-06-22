const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const doctorsController = require('../controllers/doctors.controller');

const router = express.Router();

router.get('/featured', doctorsController.getFeaturedDoctors);
router.get('/', doctorsController.listDoctors);
router.get('/:id', doctorsController.getDoctorById);

router.post('/', verifyJWT, authorizeRoles('doctor'), doctorsController.createDoctor);
router.put('/:id', verifyJWT, authorizeRoles('doctor'), doctorsController.updateDoctor);

router.patch(
  '/:id/verify',
  verifyJWT,
  authorizeRoles('admin'),
  doctorsController.verifyDoctor
);
router.patch(
  '/:id/reject',
  verifyJWT,
  authorizeRoles('admin'),
  doctorsController.rejectDoctor
);
router.delete(
  '/:id/verify',
  verifyJWT,
  authorizeRoles('admin'),
  doctorsController.revokeVerification
);

module.exports = router;
