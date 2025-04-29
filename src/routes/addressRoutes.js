const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const authMiddleware = require('../middlewares/authMiddleware'); // Giả định bạn có middleware xác thực

// Bảo vệ tất cả routes với middleware xác thực
router.use(authMiddleware.verifyToken);

// Lấy tất cả địa chỉ của một người dùng
router.get('/user/:userId', addressController.getAddressesByUser);

// Lấy một địa chỉ cụ thể
router.get('/:addressId', addressController.getAddress);

// Thêm địa chỉ mới
router.post('/', addressController.addAddress);

// Cập nhật địa chỉ
router.put('/:addressId', addressController.updateAddress);

// Xóa địa chỉ
router.delete('/:addressId', addressController.deleteAddress);

// Đặt địa chỉ mặc định
router.patch('/:addressId/set-default', addressController.setDefaultAddress);

// Lấy địa chỉ mặc định của người dùng
router.get('/default/user/:userId', addressController.getDefaultAddress);

module.exports = router;
