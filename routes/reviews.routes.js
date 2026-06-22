const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');
const reviewsController = require('../controllers/reviews.controller');
const {
  listReviewsRules,
  createReviewRules,
  updateReviewRules,
  reviewIdParam,
} = require('../validators/reviews.validator');

const router = express.Router();

router.get('/', listReviewsRules, validate, reviewsController.listReviews);
router.get('/my', verifyJWT, authorizeRoles('patient'), reviewsController.getMyReviews);
router.post(
  '/',
  verifyJWT,
  authorizeRoles('patient'),
  createReviewRules,
  validate,
  reviewsController.createReview
);
router.put(
  '/:id',
  verifyJWT,
  authorizeRoles('patient'),
  updateReviewRules,
  validate,
  reviewsController.updateReview
);
router.delete(
  '/:id',
  verifyJWT,
  authorizeRoles('patient'),
  reviewIdParam,
  validate,
  reviewsController.deleteReview
);

module.exports = router;
