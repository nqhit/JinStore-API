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

router.use(authMiddleware.verifyToken);

router.get('/', getAllReviews);
router.get('/user', getUserReviews);
router.get('/product/:productId', getProductReviews);
router.post('/', createReview);
router.patch('/update/:reviewId', updateReview);
router.delete('/delete/:reviewId', deleteReview);
module.exports = router;
