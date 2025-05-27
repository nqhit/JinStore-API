const Review = require('../models/Review');
const Product = require('../models/Product');

module.exports = {
  // Create a new review
  createReview: async (req, res, next) => {
    try {
      const { productId, rating, comment } = req.body;
      const userId = req.user._id;

      // Check if product exists
      const product = await Product.findById(productId);
      if (!product) {
        const error = new Error('Không tìm thấy sản phẩm');
        error.statusCode = 404;
        throw error;
      }

      // Check if user has already reviewed this product
      const existingReview = await Review.findOne({ user: userId, product: productId });
      if (existingReview) {
        const error = new Error('You have already reviewed this product');
        error.statusCode = 400;
        throw error;
      }

      const review = new Review({
        user: userId,
        product: productId,
        rating,
        comment,
      });

      await review.save();

      // Update product's average rating
      const reviews = await Review.find({ product: productId });
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      product.averageRating = totalRating / reviews.length;
      await product.save();

      return res.status(201).json({
        success: true,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all reviews for a product
  getProductReviews: async (req, res, next) => {
    try {
      const { productId } = req.params;
      const reviews = await Review.find({ product: productId }).populate('user', 'name email').sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  },

  // Update a review
  updateReview: async (req, res, next) => {
    try {
      const { reviewId } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user._id;

      const review = await Review.findById(reviewId);
      if (!review) {
        const error = new Error('Review not found');
        error.statusCode = 404;
        throw error;
      }

      // Check if user is the owner of the review
      if (review.user.toString() !== userId.toString()) {
        const error = new Error('You are not authorized to update this review');
        error.statusCode = 403;
        throw error;
      }

      review.rating = rating;
      review.comment = comment;
      await review.save();

      // Update product's average rating
      const product = await Product.findById(review.product);
      const reviews = await Review.find({ product: review.product });
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      product.averageRating = totalRating / reviews.length;
      await product.save();

      return res.status(200).json({
        success: true,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete a review
  deleteReview: async (req, res, next) => {
    try {
      const { reviewId } = req.params;
      const userId = req.user._id;

      const review = await Review.findById(reviewId);
      if (!review) {
        const error = new Error('Review not found');
        error.statusCode = 404;
        throw error;
      }

      // Check if user is the owner of the review or an admin
      if (review.user.toString() !== userId.toString() && !req.user.isAdmin) {
        const error = new Error('You are not authorized to delete this review');
        error.statusCode = 403;
        throw error;
      }

      await review.remove();

      // Update product's average rating
      const product = await Product.findById(review.product);
      const reviews = await Review.find({ product: review.product });
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      product.averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
      await product.save();

      return res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
  
  getUserReviews: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const reviews = await Review.find({ user: userId }).populate('product', 'name images').sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all reviews
  getAllReviews: async (req, res, next) => {
    try {
      const reviews = await Review.find()
        .populate('user', 'name email')
        .populate('product', 'name')
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  },
};
