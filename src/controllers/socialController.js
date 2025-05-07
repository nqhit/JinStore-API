const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const { generateRefreshToken, generateToken } = require('../utils/createToken');
const { generateUsername } = require('../utils/generateUsername');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken'); // Giả sử bạn có model RefreshToken

const APP_URL = process.env.CLIENT_URL_V1 || process.env.CLIENT_URL_V2;

// Callback từ Google
const googleCallback = async (req, res) => {
  try {
    const user = req.user;
    console.log(user);
    // Kiểm tra dữ liệu từ Google
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

      if (resultUser) {
        resultUser.authProvider = 'google';
        resultUser.googleId = user.googleId;
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

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      path: '/',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    // res.redirect(`http://localhost:5173/JinStore/social/callback?accessToken=${accessToken}`);
    res.redirect(`${APP_URL}/login-google/success`);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
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
    const { password, ...others } = infoUser._doc;
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công',
      ...others,
      accessToken,
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
