const Stripe = require('stripe');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Payment = require('../models/Payment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { isSlotTaken } = require('../utils/appointmentHelpers');
const { createPaidAppointmentAndPayment } = require('../utils/paymentHelpers');

const populateOptions = [
  { path: 'patientId', select: 'name email photo' },
  { path: 'doctorId', select: 'doctorName specialization profileImage consultationFee' },
  { path: 'appointmentId', select: 'appointmentDate appointmentTime appointmentStatus' },
];

const appointmentPopulate = [
  { path: 'doctorId', select: 'doctorName specialization consultationFee profileImage' },
  { path: 'patientId', select: 'name email' },
];

const getStripe = () => {
  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    throw new AppError('Stripe is not configured on the server', 500);
  }

  return new Stripe(secret);
};

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

const createCheckoutSession = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const { doctorId, appointmentDate, appointmentTime, symptoms } = req.body;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

  const doctor = await Doctor.findById(doctorId);

  if (!doctor || doctor.verificationStatus !== 'verified') {
    throw new AppError('Doctor not found or not verified', 404);
  }

  const slotTaken = await isSlotTaken(doctorId, appointmentDate, appointmentTime);

  if (slotTaken) {
    throw new AppError('This time slot is already booked', 409);
  }

  const amount = doctor.consultationFee;
  const amountCents = Math.round(amount * 100);

  if (amountCents < 100) {
    throw new AppError('Consultation fee must be at least $1', 400);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: req.user.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Consultation with Dr. ${doctor.doctorName}`,
            description: `${doctor.specialization} — ${appointmentDate} at ${appointmentTime}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      patientId: req.user.id,
      doctorId: doctorId.toString(),
      appointmentDate: String(appointmentDate),
      appointmentTime: String(appointmentTime),
      symptoms: (symptoms || '').slice(0, 500),
    },
    success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/payment/cancel?doctorId=${doctorId}`,
  });

  res.status(200).json({
    success: true,
    data: {
      url: session.url,
      sessionId: session.id,
    },
  });
});

const confirmCheckoutSession = asyncHandler(async (req, res) => {
  const stripe = getStripe();
  const { sessionId } = req.body;

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new AppError('Payment has not been completed for this session', 400);
  }

  const metadata = session.metadata || {};
  const { patientId, doctorId, appointmentDate, appointmentTime, symptoms } = metadata;

  if (!patientId || !doctorId || !appointmentDate || !appointmentTime) {
    throw new AppError('Checkout session is missing booking details', 400);
  }

  if (patientId !== req.user.id) {
    throw new AppError('Forbidden — this checkout session does not belong to you', 403);
  }

  const paymentIntent = session.payment_intent;
  const transactionId =
    (typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id) || session.id;
  const amount = session.amount_total ? session.amount_total / 100 : 0;

  try {
    const { appointment, payment, created } = await createPaidAppointmentAndPayment({
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      symptoms,
      amount,
      transactionId,
    });

    const populatedAppointment = await Appointment.findById(appointment._id).populate(
      appointmentPopulate
    );

    res.status(200).json({
      success: true,
      data: {
        appointment: populatedAppointment,
        payment,
        created,
      },
    });
  } catch (err) {
    if (err.code === 'SLOT_TAKEN') {
      throw new AppError('This time slot is already booked', 409);
    }

    throw err;
  }
});

const handleWebhook = async (req, res) => {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
  }

  const signature = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const transactionId = session.payment_intent || session.id;
    const metadata = session.metadata || {};

    const existing = await Payment.findOne({ transactionId });

    if (existing) {
      return res.status(200).json({ received: true });
    }

    const { patientId, doctorId, appointmentDate, appointmentTime, symptoms } = metadata;

    if (!patientId || !doctorId || !appointmentDate || !appointmentTime) {
      console.error('Webhook missing metadata:', metadata);
      return res.status(200).json({ received: true });
    }

    const amount = session.amount_total ? session.amount_total / 100 : 0;

    try {
      await createPaidAppointmentAndPayment({
        patientId,
        doctorId,
        appointmentDate,
        appointmentTime,
        symptoms,
        amount,
        transactionId,
      });
    } catch (err) {
      if (err.code === 'SLOT_TAKEN') {
        console.error('Webhook: slot already taken for session', session.id);
        return res.status(200).json({ received: true });
      }

      if (err.code === 11000) {
        return res.status(200).json({ received: true });
      }

      console.error('Webhook processing error:', err.message);
      return res.status(500).json({ success: false, message: 'Webhook handler failed' });
    }
  }

  return res.status(200).json({ received: true });
};

module.exports = {
  listPayments,
  createCheckoutSession,
  confirmCheckoutSession,
  handleWebhook,
};
