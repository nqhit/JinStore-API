const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
  getUserReviews,
  getAllReviews,
} = require('../controllers/review.controller');
const { verifyToken, verifyTokenAndAdmin } = require('../middlewares/authMiddleware');

router.post('/create', verifyToken, createReview);
router.get('/product/:productId', verifyToken, getProductReviews);

// router.get('/', getAllReviews);
// router.get('/user', getUserReviews);
// router.patch('/update/:reviewId', updateReview);
// router.delete('/delete/:reviewId', deleteReview);
module.exports = router;
