const { body, param, query } = require('express-validator');

const listDoctorsRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('sort')
    .optional()
    .isIn(['fee_asc', 'fee_desc', 'experience_asc', 'experience_desc', 'rating_desc'])
    .withMessage('Invalid sort parameter'),
];

const doctorIdParam = [param('id').isMongoId().withMessage('Invalid doctor ID')];

const createDoctorRules = [
  body('doctorName').optional().trim().notEmpty().withMessage('Doctor name cannot be empty'),
  body('specialization').trim().notEmpty().withMessage('Specialization is required'),
  body('experience').isInt({ min: 0 }).withMessage('Experience must be 0 or greater'),
  body('consultationFee').isFloat({ min: 1 }).withMessage('Consultation fee must be greater than 0'),
  body('qualifications').optional().trim(),
  body('hospitalName').optional().trim(),
  body('profileImage').optional().trim(),
  body('availableDays').optional().isArray().withMessage('availableDays must be an array'),
  body('availableSlots').optional().isArray().withMessage('availableSlots must be an array'),
];

const updateDoctorRules = [
  ...doctorIdParam,
  body('doctorName').optional().trim().notEmpty().withMessage('Doctor name cannot be empty'),
  body('specialization').optional().trim().notEmpty().withMessage('Specialization cannot be empty'),
  body('experience').optional().isInt({ min: 0 }).withMessage('Experience must be 0 or greater'),
  body('consultationFee')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Consultation fee must be greater than 0'),
  body('qualifications').optional().trim(),
  body('hospitalName').optional().trim(),
  body('profileImage').optional().trim(),
  body('availableDays').optional().isArray().withMessage('availableDays must be an array'),
  body('availableSlots').optional().isArray().withMessage('availableSlots must be an array'),
];

module.exports = {
  listDoctorsRules,
  doctorIdParam,
  createDoctorRules,
  updateDoctorRules,
};
