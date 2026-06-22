const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Review = require('../models/Review');
const asyncHandler = require('../utils/asyncHandler');

const getStats = asyncHandler(async (req, res) => {
  const [totalDoctors, totalPatients, totalAppointments, totalReviews] = await Promise.all([
    Doctor.countDocuments({ verificationStatus: 'verified' }),
    User.countDocuments({ role: 'patient' }),
    Appointment.countDocuments(),
    Review.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalDoctors,
      totalPatients,
      totalAppointments,
      totalReviews,
    },
  });
});

const getAdminAnalytics = asyncHandler(async (req, res) => {
  const [totalPatients, totalDoctors, totalAppointments, doctorPerformance] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Doctor.countDocuments({ verificationStatus: 'verified' }),
    Appointment.countDocuments(),
    Review.aggregate([
      {
        $group: {
          _id: '$doctorId',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor',
        },
      },
      { $unwind: '$doctor' },
      {
        $project: {
          _id: 0,
          doctorName: '$doctor.doctorName',
          avgRating: { $round: ['$avgRating', 1] },
          totalReviews: 1,
        },
      },
      { $sort: { avgRating: -1, totalReviews: -1 } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalPatients,
      totalDoctors,
      totalAppointments,
      doctorPerformance,
    },
  });
});

module.exports = {
  getStats,
  getAdminAnalytics,
};
