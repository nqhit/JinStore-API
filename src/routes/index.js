const express = require('express');
const router = express.Router();

// Import các route con
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/products', require('./productRoutes'));
router.use('/discounts', require('./discountRoutes'));
router.use('/categories', require('./categoryRoutes'));
router.use('/otp', require('./verifyOTPRoutes'));
router.use('/reviews', require('./reviewRoutes'));
router.use('/cart', require('./cartRoutes'));

// Nếu cần sau này thì mở lại:
// router.use('/orders', require('./orderRoutes'));
// router.use('/payments', require('./paymentRoutes'));
// router.use('/wishlist', require('./wishlistRoutes'));

module.exports = router;
