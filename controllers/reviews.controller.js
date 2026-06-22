const Review = require('../models/Review');
const Appointment = require('../models/Appointment');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const reviewPopulate = [
  { path: 'patientId', select: 'name photo' },
  { path: 'doctorId', select: 'doctorName specialization profileImage' },
];

const listReviews = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.doctorId) {
    filter.doctorId = req.query.doctorId;
  }

  const data = await Review.find(filter)
    .populate(reviewPopulate)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data,
  });
});

const getMyReviews = asyncHandler(async (req, res) => {
  const data = await Review.find({ patientId: req.user.id })
    .populate(reviewPopulate)
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data,
  });
});

const createReview = asyncHandler(async (req, res) => {
  const { doctorId, rating, reviewText } = req.body;

  const completedAppointment = await Appointment.findOne({
    patientId: req.user.id,
    doctorId,
    appointmentStatus: 'completed',
  });

  if (!completedAppointment) {
    throw new AppError(
      'You can only review doctors after a completed appointment',
      400
    );
  }

  const existingReview = await Review.findOne({
    patientId: req.user.id,
    doctorId,
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this doctor', 409);
  }

  const review = await Review.create({
    patientId: req.user.id,
    doctorId,
    rating,
    reviewText,
  });

  const populated = await Review.findById(review._id).populate(reviewPopulate);

  res.status(201).json({
    success: true,
    data: populated,
    message: 'Review submitted successfully',
  });
});

const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.patientId.toString() !== req.user.id) {
    throw new AppError('Forbidden — you can only update your own reviews', 403);
  }

  if (req.body.rating !== undefined) {
    review.rating = req.body.rating;
  }

  if (req.body.reviewText !== undefined) {
    review.reviewText = req.body.reviewText;
  }

  await review.save();

  const populated = await Review.findById(review._id).populate(reviewPopulate);

  res.status(200).json({
    success: true,
    data: populated,
    message: 'Review updated successfully',
  });
});

const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  if (review.patientId.toString() !== req.user.id) {
    throw new AppError('Forbidden — you can only delete your own reviews', 403);
  }

  await review.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
  });
});

module.exports = {
  listReviews,
  getMyReviews,
  createReview,
  updateReview,
  deleteReview,
};
