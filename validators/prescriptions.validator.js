const { body, param } = require('express-validator');

const createPrescriptionRules = [
  body('patientId').isMongoId().withMessage('Valid patient ID is required'),
  body('appointmentId').isMongoId().withMessage('Valid appointment ID is required'),
  body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  body('medications').isArray({ min: 1 }).withMessage('At least one medication is required'),
  body('medications.*.name').trim().notEmpty().withMessage('Medication name is required'),
  body('medications.*.dosage').trim().notEmpty().withMessage('Medication dosage is required'),
  body('medications.*.duration').trim().notEmpty().withMessage('Medication duration is required'),
  body('notes').optional().trim(),
];

const updatePrescriptionRules = [
  param('id').isMongoId().withMessage('Invalid prescription ID'),
  body('diagnosis').optional().trim().notEmpty().withMessage('Diagnosis cannot be empty'),
  body('medications').optional().isArray({ min: 1 }).withMessage('At least one medication is required'),
  body('medications.*.name').optional().trim().notEmpty().withMessage('Medication name is required'),
  body('medications.*.dosage').optional().trim().notEmpty().withMessage('Medication dosage is required'),
  body('medications.*.duration').optional().trim().notEmpty().withMessage('Medication duration is required'),
  body('notes').optional().trim(),
];

const prescriptionIdParam = [param('id').isMongoId().withMessage('Invalid prescription ID')];

module.exports = {
  createPrescriptionRules,
  updatePrescriptionRules,
  prescriptionIdParam,
};
