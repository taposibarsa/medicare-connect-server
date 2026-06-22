const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');

const getDoctorByUserId = async (userId) => {
  return Doctor.findOne({ userId });
};

const buildMatchFilter = (baseFilter = {}, search) => {
  const filter = { ...baseFilter };

  if (search) {
    filter.$or = [
      { doctorName: { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } },
    ];
  }

  return filter;
};

const getSortStage = (sort) => {
  switch (sort) {
    case 'fee_asc':
      return { consultationFee: 1 };
    case 'fee_desc':
      return { consultationFee: -1 };
    case 'experience_asc':
      return { experience: 1 };
    case 'experience_desc':
      return { experience: -1 };
    case 'rating_desc':
      return { avgRating: -1, experience: -1 };
    default:
      return { createdAt: -1 };
  }
};

const doctorsWithRatingsPipeline = (matchFilter, sort = 'createdAt', skip = 0, limit = 9) => {
  return [
    { $match: matchFilter },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'doctorId',
        as: 'reviews',
      },
    },
    {
      $addFields: {
        reviewCount: { $size: '$reviews' },
        avgRating: {
          $cond: {
            if: { $gt: [{ $size: '$reviews' }, 0] },
            then: { $round: [{ $avg: '$reviews.rating' }, 1] },
            else: 0,
          },
        },
      },
    },
    { $project: { reviews: 0 } },
    { $sort: getSortStage(sort) },
    { $skip: skip },
    { $limit: limit },
  ];
};

const countDoctors = async (matchFilter) => {
  return Doctor.countDocuments(matchFilter);
};

const findDoctorsWithRatings = async ({ filter, search, sort, page, limit }) => {
  const matchFilter = buildMatchFilter(filter, search);
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 9));
  const skip = (pageNum - 1) * limitNum;

  const [data, total] = await Promise.all([
    Doctor.aggregate(doctorsWithRatingsPipeline(matchFilter, sort, skip, limitNum)),
    countDoctors(matchFilter),
  ]);

  return {
    data,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

const findFeaturedDoctors = async (limit = 6) => {
  const limitNum = Math.min(20, Math.max(1, parseInt(limit, 10) || 6));
  const matchFilter = { verificationStatus: 'verified' };

  return Doctor.aggregate(
    doctorsWithRatingsPipeline(matchFilter, 'rating_desc', 0, limitNum)
  );
};

const findDoctorByIdWithRatings = async (doctorId) => {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    return null;
  }

  const results = await Doctor.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(doctorId),
        verificationStatus: 'verified',
      },
    },
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'doctorId',
        as: 'reviews',
      },
    },
    {
      $addFields: {
        reviewCount: { $size: '$reviews' },
        avgRating: {
          $cond: {
            if: { $gt: [{ $size: '$reviews' }, 0] },
            then: { $round: [{ $avg: '$reviews.rating' }, 1] },
            else: 0,
          },
        },
      },
    },
    { $project: { reviews: 0 } },
  ]);

  return results[0] || null;
};

module.exports = {
  getDoctorByUserId,
  buildMatchFilter,
  findDoctorsWithRatings,
  findFeaturedDoctors,
  findDoctorByIdWithRatings,
};
