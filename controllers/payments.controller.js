const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const notImplemented = require('../utils/notImplemented');

const populateOptions = [
  { path: 'patientId', select: 'name email photo' },
  { path: 'doctorId', select: 'doctorName specialization profileImage consultationFee' },
  { path: 'appointmentId', select: 'appointmentDate appointmentTime appointmentStatus' },
];

const listPayments = asyncHandler(async (req, res) => {
  let filter = {};

  if (req.user.role === 'patient') {
    filter = { patientId: req.user.id };
  } else if (req.user.role !== 'admin') {
    throw new AppError('Forbidden — insufficient permissions', 403);
  }

  const data = await Payment.find(filter)
    .populate(populateOptions)
    .sort({ paymentDate: -1 });

  const total = data.reduce((sum, payment) => sum + payment.amount, 0);

  res.status(200).json({
    success: true,
    data,
    total,
  });
});

module.exports = {
  listPayments,
  createCheckoutSession: notImplemented,
  handleWebhook: notImplemented,
};
