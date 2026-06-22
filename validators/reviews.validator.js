const { body, param, query } = require('express-validator');

const listReviewsRules = [
  query('doctorId').optional().isMongoId().withMessage('Invalid doctor ID'),
];

const createReviewRules = [
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('reviewText').trim().notEmpty().withMessage('Review text is required'),
];

const updateReviewRules = [
  param('id').isMongoId().withMessage('Invalid review ID'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('reviewText').optional().trim().notEmpty().withMessage('Review text cannot be empty'),
];

const reviewIdParam = [param('id').isMongoId().withMessage('Invalid review ID')];

module.exports = {
  listReviewsRules,
  createReviewRules,
  updateReviewRules,
  reviewIdParam,
};
