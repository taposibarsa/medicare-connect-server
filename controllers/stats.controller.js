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
  const Payment = require('../models/Payment');

  const [
    totalPatients,
    totalDoctors,
    totalAppointments,
    pendingDoctorCount,
    totalRevenueResult,
    appointmentStatusBreakdown,
    doctorPerformance,
  ] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Doctor.countDocuments({ verificationStatus: 'verified' }),
    Appointment.countDocuments(),
    Doctor.countDocuments({ verificationStatus: 'pending' }),
    Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
    Appointment.aggregate([
      { $group: { _id: '$appointmentStatus', count: { $sum: 1 } } },
      { $project: { _id: 0, status: '$_id', count: 1 } },
    ]),
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

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setUTCHours(23, 59, 59, 999);

  const todaysAppointments = await Appointment.countDocuments({
    appointmentDate: { $gte: todayStart, $lte: todayEnd },
  });

  res.status(200).json({
    success: true,
    data: {
      totalPatients,
      totalDoctors,
      totalAppointments,
      pendingDoctorCount,
      todaysAppointments,
      totalRevenue: totalRevenueResult[0]?.total || 0,
      appointmentStatusBreakdown,
      doctorPerformance,
    },
  });
});

module.exports = {
  getStats,
  getAdminAnalytics,
};
