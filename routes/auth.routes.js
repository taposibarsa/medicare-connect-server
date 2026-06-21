const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');

const router = express.Router();

router.get('/me', verifyJWT, (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
});

module.exports = router;
