const express = require('express');
const passport = require('passport');
const mobileAuthController = require('../controllers/mobile.auth.controller');
const mobileSocialController = require('../controllers/mobile.social.controller');
const { verifyToken } = require('../middlewares/verifyToken');

const router = express.Router();

// ========== MOBILE AUTH ROUTES ==========

// Đăng ký cho mobile
router.post('/register', mobileAuthController.registerUser);

// Đăng nhập cho mobile
router.post('/login', mobileAuthController.loginUser);

// Refresh token cho mobile
router.post('/refresh-token', mobileAuthController.requestRefreshToken);

// Logout cho mobile
router.post('/logout', mobileAuthController.userLogout);

// Kiểm tra trạng thái đăng nhập
router.post('/check-auth', mobileAuthController.checkAuthStatus);

// ========== MOBILE SOCIAL AUTH ROUTES ==========

// Google OAuth cho Mobile - Bước 1: Redirect đến Google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account', // Cho phép user chọn tài khoản Google
  }),
);

// Google OAuth cho Mobile - Bước 2: Callback từ Google
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: process.env.MOBILE_URL_V1 + '/auth/google/error',
    session: false,
  }),
  mobileSocialController.googleMobileCallback,
);

// API để mobile app lấy thông tin user sau khi đăng nhập Google
router.post('/google/user-info', mobileSocialController.getMobileGoogleUser);

// Liên kết tài khoản Google với tài khoản hiện tại
router.post('/google/link', verifyToken, mobileSocialController.linkGoogleAccount);

// Hủy liên kết tài khoản Google
router.post('/google/unlink', verifyToken, mobileSocialController.unlinkGoogleAccount);

// ========== MOBILE USER PROFILE ROUTES ==========

// Lấy thông tin profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const User = require('../../models/User');
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng',
        code: 'USER_NOT_FOUND',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin profile thành công',
      data: user,
    });
  } catch (error) {
    console.error('❌ Get Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
      code: 'SYSTEM_ERROR',
    });
  }
});

// Cập nhật profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { fullname, email, avatar } = req.body;
    const User = require('../../models/User');

    // Kiểm tra email đã tồn tại chưa (nếu thay đổi email)
    if (email) {
      const emailExists = await User.findOne({
        email: email,
        _id: { $ne: req.user._id },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email đã được sử dụng',
          code: 'EMAIL_TAKEN',
        });
      }
    }

    const updateData = {};
    if (fullname) updateData.fullname = fullname;
    if (email) updateData.email = email;
    if (avatar) updateData.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Cập nhật profile thành công',
      data: updatedUser,
    });
  } catch (error) {
    console.error('❌ Update Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
      code: 'SYSTEM_ERROR',
    });
  }
});

// Đổi mật khẩu
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const bcrypt = require('bcryptjs');
    const validator = require('validator');
    const User = require('../../models/User');

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin',
        code: 'MISSING_FIELDS',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới và xác nhận mật khẩu không khớp',
        code: 'PASSWORD_MISMATCH',
      });
    }

    if (
      !validator.isStrongPassword(newPassword, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
      })
    ) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 8 ký tự bao gồm chữ thường, in hoa, số',
        code: 'WEAK_PASSWORD',
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    // Kiểm tra mật khẩu hiện tại (chỉ khi user có password - không phải Google user)
    if (user.password) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không đúng',
          code: 'WRONG_CURRENT_PASSWORD',
        });
      }
    }

    // Hash mật khẩu mới
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Cập nhật mật khẩu
    await User.findByIdAndUpdate(req.user._id, {
      password: hashedNewPassword,
      authProvider: user.googleId ? 'both' : 'local',
    });

    return res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công',
      code: 'PASSWORD_CHANGED',
    });
  } catch (error) {
    console.error('❌ Change Password Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server',
      error: error.message,
      code: 'SYSTEM_ERROR',
    });
  }
});

module.exports = router;
