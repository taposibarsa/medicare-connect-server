const User = require('../models/User');
const Doctor = require('../models/Doctor');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const formatUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  photo: user.photo,
  phone: user.phone,
  gender: user.gender,
  status: user.status,
  createdAt: user.createdAt,
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: formatUser(user),
  });
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const protectedFields = ['role', 'email', 'status', 'password'];
  const attemptedProtected = protectedFields.filter((field) => req.body[field] !== undefined);

  if (attemptedProtected.length > 0) {
    throw new AppError(
      `Cannot update protected fields: ${attemptedProtected.join(', ')}`,
      400
    );
  }

  const allowedFields = ['name', 'photo', 'phone', 'gender'];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  });

  await user.save();

  res.status(200).json({
    success: true,
    data: formatUser(user),
    message: 'Profile updated successfully',
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: users.map(formatUser),
  });
});

const suspendUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new AppError('You cannot suspend your own account', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { status: 'suspended' },
    { new: true, runValidators: true }
  );

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: formatUser(user),
    message: 'User suspended successfully',
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new AppError('You cannot delete your own account', 400);
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role === 'doctor') {
    await Doctor.deleteOne({ userId: user._id });
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

module.exports = {
  getMe,
  updateMe,
  listUsers,
  suspendUser,
  deleteUser,
};
