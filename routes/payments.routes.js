const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');
const paymentsController = require('../controllers/payments.controller');
const { createCheckoutRules, confirmSessionRules } = require('../validators/payments.validator');

const router = express.Router();

router.use(verifyJWT);

router.get('/', paymentsController.listPayments);
router.post(
  '/checkout',
  authorizeRoles('patient'),
  createCheckoutRules,
  validate,
  paymentsController.createCheckoutSession
);
router.post(
  '/confirm-session',
  authorizeRoles('patient'),
  confirmSessionRules,
  validate,
  paymentsController.confirmCheckoutSession
);

module.exports = router;
