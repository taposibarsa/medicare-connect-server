const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const paymentsController = require('../controllers/payments.controller');

const router = express.Router();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentsController.handleWebhook
);

router.use(verifyJWT);

router.get('/', paymentsController.listPayments);
router.post('/checkout', authorizeRoles('patient'), paymentsController.createCheckoutSession);

module.exports = router;
