const notImplemented = (req, res) => {
  res.status(501).json({
    success: false,
    message: 'This endpoint will be implemented in Phase 2',
  });
};

module.exports = notImplemented;
