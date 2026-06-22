const { body, param } = require('express-validator');

const updateMeRules = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('photo').optional().trim(),
  body('phone').optional().trim(),
  body('gender').optional().isIn(['male', 'female', 'other', '']).withMessage('Invalid gender'),
];

const userIdParam = [param('id').isMongoId().withMessage('Invalid user ID')];

module.exports = {
  updateMeRules,
  userIdParam,
};
