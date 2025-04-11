const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const { generateRefreshToken, generateToken } = require('../utils/createToken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken'); // Giả sử bạn có model RefreshToken

// Đăng nhập bằng Google

// Callback từ Google
const googleCallback = async (req, res) => {
  try {
    const user = req.user;

    // Kiểm tra dữ liệu từ Google
    if (!user.googleId) {
      return res.status(400).json({ message: 'Không thể lấy googleId từ Google' });
    }

    // Kiểm tra hoặc tạo người dùng trong cơ sở dữ liệu
    let existingUser = await User.findOne({ googleId: user.googleId });
    if (!existingUser) {
      // Đảm bảo email và các trường khác tồn tại
      const email = user.emails?.[0]?.value;
      if (!email) {
        return res.status(400).json({ message: 'Không thể lấy email từ Google' });
      }

      existingUser = await User.create({
        authProvider: 'google',
        googleId: user.googleId,
        fullname: user.displayName || 'Unknown',
        email: email,
        avatar: user.photos?.[0]?.value || null,
      });
    }

    // Tạo access token và refresh token
    const accessToken = generateToken(existingUser);
    const refreshToken = generateRefreshToken(existingUser);

    // Lưu hoặc cập nhật refresh token trong cơ sở dữ liệu
    const userId = existingUser._id;
    const userRefreshToken = await RefreshToken.findOne({ userId });

    if (userRefreshToken) {
      await RefreshToken.findByIdAndUpdate(
        userRefreshToken._id,
        { token: refreshToken, updatedAt: Date.now() },
        { new: true },
      );
    } else {
      await new RefreshToken({ token: refreshToken, userId }).save();
    }

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      path: '/',
      sameSite: 'strict',
    });

    res.redirect(`http://localhost:5173/social/callback?accessToken=${accessToken}`);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = {
  googleCallback,
};
