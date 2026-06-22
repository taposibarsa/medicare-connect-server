const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');
const doctorsController = require('../controllers/doctors.controller');
const {
  listDoctorsRules,
  doctorIdParam,
  createDoctorRules,
  updateDoctorRules,
} = require('../validators/doctors.validator');

const router = express.Router();

router.get('/featured', doctorsController.getFeaturedDoctors);
router.get('/', listDoctorsRules, validate, doctorsController.listDoctors);
router.get('/:id', doctorIdParam, validate, doctorsController.getDoctorById);

router.post(
  '/',
  verifyJWT,
  authorizeRoles('doctor'),
  createDoctorRules,
  validate,
  doctorsController.createDoctor
);
router.put(
  '/:id',
  verifyJWT,
  authorizeRoles('doctor'),
  updateDoctorRules,
  validate,
  doctorsController.updateDoctor
);

router.patch(
  '/:id/verify',
  verifyJWT,
  authorizeRoles('admin'),
  doctorIdParam,
  validate,
  doctorsController.verifyDoctor
);
router.patch(
  '/:id/reject',
  verifyJWT,
  authorizeRoles('admin'),
  doctorIdParam,
  validate,
  doctorsController.rejectDoctor
);
router.delete(
  '/:id/verify',
  verifyJWT,
  authorizeRoles('admin'),
  doctorIdParam,
  validate,
  doctorsController.revokeVerification
);

module.exports = router;
