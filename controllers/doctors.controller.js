const Doctor = require('../models/Doctor');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const {
  getDoctorByUserId,
  findDoctorsWithRatings,
  findFeaturedDoctors,
  findDoctorByIdWithRatings,
} = require('../utils/doctorHelpers');

const listDoctors = asyncHandler(async (req, res) => {
  const { search, sort, page, limit } = req.query;

  const result = await findDoctorsWithRatings({
    filter: { verificationStatus: 'verified' },
    search,
    sort,
    page,
    limit,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

const getFeaturedDoctors = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const data = await findFeaturedDoctors(limit);

  res.status(200).json({
    success: true,
    data,
  });
});

const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await findDoctorByIdWithRatings(req.params.id);

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  res.status(200).json({
    success: true,
    data: doctor,
  });
});

const getMyDoctor = asyncHandler(async (req, res) => {
  const doctor = await getDoctorByUserId(req.user.id);

  if (!doctor) {
    throw new AppError('Doctor profile not found', 404);
  }

  const data = await findDoctorByIdWithRatings(doctor._id.toString(), { includeUnverified: true });

  res.status(200).json({
    success: true,
    data,
  });
});

const listAdminDoctors = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};

  if (status) {
    filter.verificationStatus = status;
  }

  const result = await findDoctorsWithRatings({
    filter,
    page: 1,
    limit: 100,
  });

  res.status(200).json({
    success: true,
    ...result,
  });
});

const createDoctor = asyncHandler(async (req, res) => {
  const existing = await getDoctorByUserId(req.user.id);

  if (existing) {
    throw new AppError('Doctor profile already exists for this user', 409);
  }

  const doctor = await Doctor.create({
    userId: req.user.id,
    doctorName: req.body.doctorName || req.user.name,
    specialization: req.body.specialization,
    qualifications: req.body.qualifications || '',
    experience: req.body.experience,
    consultationFee: req.body.consultationFee,
    hospitalName: req.body.hospitalName || '',
    profileImage: req.body.profileImage || '',
    availableDays: req.body.availableDays || [],
    availableSlots: req.body.availableSlots || [],
    verificationStatus: 'pending',
  });

  res.status(201).json({
    success: true,
    data: doctor,
    message: 'Doctor profile created. Pending admin verification.',
  });
});

const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  if (doctor.userId.toString() !== req.user.id) {
    throw new AppError('Forbidden — you can only update your own profile', 403);
  }

  const allowedFields = [
    'doctorName',
    'specialization',
    'qualifications',
    'experience',
    'consultationFee',
    'hospitalName',
    'profileImage',
    'availableDays',
    'availableSlots',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      doctor[field] = req.body[field];
    }
  });

  await doctor.save();

  res.status(200).json({
    success: true,
    data: doctor,
  });
});

const verifyDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: 'verified' },
    { new: true, runValidators: true }
  );

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  res.status(200).json({
    success: true,
    data: doctor,
    message: 'Doctor verified successfully',
  });
});

const rejectDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: 'rejected' },
    { new: true, runValidators: true }
  );

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  res.status(200).json({
    success: true,
    data: doctor,
    message: 'Doctor verification rejected',
  });
});

const revokeVerification = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: 'pending' },
    { new: true, runValidators: true }
  );

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  res.status(200).json({
    success: true,
    data: doctor,
    message: 'Doctor verification revoked — status set to pending',
  });
});

module.exports = {
  listDoctors,
  getFeaturedDoctors,
  getDoctorById,
  getMyDoctor,
  listAdminDoctors,
  createDoctor,
  updateDoctor,
  verifyDoctor,
  rejectDoctor,
  revokeVerification,
};
