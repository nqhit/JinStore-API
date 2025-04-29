const router = require('express').Router();
const { getAllUsers, getUserInfo, updateUser, deleteUser, updatePassword } = require('../controllers/userController');
const { verifyToken, verifyTokenAndAdmin } = require('../middlewares/authMiddleware');

// Admin routes
router.get('/', verifyTokenAndAdmin, getAllUsers);
router.delete('/:id', verifyTokenAndAdmin, deleteUser);

// Authenticated user routes
router.get('/:id', verifyToken, getUserInfo);
router.patch('/info-user/:id', verifyToken, updateUser);

// Public routes
router.patch('/reset-password', updatePassword);

module.exports = router;
