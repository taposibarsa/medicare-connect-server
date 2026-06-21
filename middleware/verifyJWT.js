const jwt = require('jsonwebtoken');
const User = require('../models/User');

const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized — no token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: 'Server misconfiguration — JWT secret not set',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized — invalid or expired token',
      });
    }

    const userId = decoded.sub || decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized — invalid token payload',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized — user not found',
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden — account suspended',
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = verifyJWT;
