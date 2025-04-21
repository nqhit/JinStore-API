const {
  getAllUsers,
  getUserInfo,
  updateUserInfo,
  updateDeliveryAddress,
  deleteUser,
  updatePassword,
} = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = require('express').Router();

router.get('/', authMiddleware.verifyTokenAndAdmin, getAllUsers);
router.get('/:id', authMiddleware.verifyToken, getUserInfo);

router.patch('/info-user/:id', authMiddleware.verifyToken, updateUserInfo);
router.patch('/address-user/:id', authMiddleware.verifyToken, updateDeliveryAddress);

router.patch('/reset-password', updatePassword);

router.delete('/:id', authMiddleware.verifyTokenAndAdmin, deleteUser);

module.exports = router;
