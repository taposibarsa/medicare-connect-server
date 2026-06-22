const express = require('express');
const verifyJWT = require('../middleware/verifyJWT');
const authorizeRoles = require('../middleware/authorizeRoles');
const reviewsController = require('../controllers/reviews.controller');

const router = express.Router();

router.get('/', reviewsController.listReviews);
router.get('/my', verifyJWT, authorizeRoles('patient'), reviewsController.getMyReviews);
router.post('/', verifyJWT, authorizeRoles('patient'), reviewsController.createReview);
router.put('/:id', verifyJWT, authorizeRoles('patient'), reviewsController.updateReview);
router.delete('/:id', verifyJWT, authorizeRoles('patient'), reviewsController.deleteReview);

module.exports = router;
