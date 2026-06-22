const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');
const prescriptionsController = require('../controllers/prescriptions.controller');
const {
  createPrescriptionRules,
  updatePrescriptionRules,
  prescriptionIdParam,
} = require('../validators/prescriptions.validator');

const router = express.Router();

router.use(verifyJWT);

router.get('/', prescriptionsController.listPrescriptions);
router.post(
  '/',
  authorizeRoles('doctor'),
  createPrescriptionRules,
  validate,
  prescriptionsController.createPrescription
);
router.put(
  '/:id',
  authorizeRoles('doctor'),
  updatePrescriptionRules,
  validate,
  prescriptionsController.updatePrescription
);

module.exports = router;
