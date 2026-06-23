const express = require('express');
const router = express.Router();
const { addReview, getReviews, deleteReview } = require('../controllers/reviewController');
const { protect, requireApproved } = require('../middleware/auth');

router.get('/', protect, getReviews);
router.post('/', protect, requireApproved, addReview);
router.delete('/:id', protect, requireApproved, deleteReview);

module.exports = router;
