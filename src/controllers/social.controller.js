const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const { generateRefreshToken, generateToken } = require('../utils/createToken');
const { generateUsername } = require('../utils/generateUsername');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken'); // Giả sử bạn có model RefreshToken

const APP_URL = process.env.CLIENT_URL_V1;

// Callback từ Google
const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    if (!user.googleId) {
      return res.status(400).json({ message: 'Không thể lấy googleId từ Google' });
    }

    // Kiểm tra hoặc tạo người dùng trong cơ sở dữ liệu
    let existingUser = await User.findOne({ googleId: user.googleId });
    if (!existingUser) {
      const email = user.email;
      if (!email) {
        return res.status(400).json({ message: 'Không thể lấy email từ Google' });
      }

      const resultUser = await User.findOne({ email: email });
      console.log('avatar', user.avatar.url);

      if (resultUser && !resultUser.isAdmin) {
        resultUser.authProvider = 'google';
        resultUser.googleId = user.googleId;
        resultUser.isAdmin = false;
        if (resultUser.fullname === null) {
          resultUser.fullname = user.fullname;
        }

        // Chỉ lưu avatar nếu DB chưa có và Google có avatar
        if (!resultUser.avatar?.url && user.avatar?.url) {
          resultUser.avatar = {
            url: user.avatar.url,
            publicId: user.avatar.publicId || '',
          };
        }

        await resultUser.save();
        existingUser = resultUser;
      } else {
        const username = generateUsername(user.fullname);
        existingUser = await User.create({
          authProvider: 'google',
          username,
          googleId: user.googleId,
          fullname: user.fullname,
          email,
          isAdmin: false,
          avatar: user.avatar || null,
        });
      }
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

    return res
      .cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Thay đổi này
        path: '/',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // Thay đổi này
        maxAge: 30 * 24 * 60 * 60 * 1000,
      })
      .redirect(`${APP_URL}/login-google/success`);
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const loginSuccess = async (req, res) => {
  try {
    const user = req.user;

    const infoUser = await User.findOne({ googleId: user.googleId });
    if (!infoUser) {
      return res.status(400).json({ message: 'Không tìm thấy người dùng' });
    }

    // Tạo access token
    const accessToken = generateToken(infoUser);
    const { password, googleId, ...others } = infoUser._doc;
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      ...others,
      isAdmin: false,
      accessToken,
      hasPassword: !!password,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin đăng nhập',
      error: error.message,
    });
  }
};

module.exports = {
  googleCallback,
  loginSuccess,
};
