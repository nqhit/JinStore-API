const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getUserReviews,
  getAllReviews,
} = require('../controllers/reviewController');
const authMiddleware = require('../middlewares/authMiddleware');

// Get all reviews (public access)
router.get('/', getAllReviews);

// Create a new review
router.post('/', authMiddleware.verifyToken, createReview);

// Get all reviews for a product
router.get('/product/:productId', getProductReviews);

// Get all reviews by a user
router.get('/user', authMiddleware.verifyToken, getUserReviews);

// Update a review
router.patch('/:reviewId', authMiddleware.verifyToken, updateReview);

// Delete a review
router.delete('/:reviewId', authMiddleware.verifyToken, deleteReview);

module.exports = router;
