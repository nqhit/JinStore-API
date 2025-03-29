const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const router = require('express').Router();

router.get('/', authMiddleware.verifyToken, userController.getAllUsers);
router.get('/:id', authMiddleware.verifyToken, userController.getUserInfo);
router.patch('/:id', authMiddleware.verifyToken, userController.updateUserInfo);
router.patch('/:id', authMiddleware.verifyToken, userController.updateDeliveryAddress);
router.delete('/:id', authMiddleware.verifyTokenAndAdmin, userController.deleteUser);

module.exports = router;
