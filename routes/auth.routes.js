const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');

const router = express.Router();

router.get('/me', verifyJWT, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

router.get('/admin-check', verifyJWT, authorizeRoles('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted',
    data: req.user,
  });
});

module.exports = router;
