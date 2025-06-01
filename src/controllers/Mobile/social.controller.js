const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const { generateRefreshToken, generateToken } = require('../utils/createToken');
const { generateUsername } = require('../utils/generateUsername');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');

const MOBILE_APP_URL = process.env.MOBILE_URL_V1;

const mobileSocialController = {
  // Google Login cho Mobile - Deep Link Callback
  googleMobileCallback: async (req, res) => {
    try {
      const user = req.user;
      console.log('Mobile Google User:', user);

      // Kiểm tra dữ liệu từ Google
      if (!user.googleId) {
        return res.status(400).json({
          success: false,
          message: 'Không thể lấy googleId từ Google',
          code: 'MISSING_GOOGLE_ID',
        });
      }

      // Kiểm tra hoặc tạo người dùng trong cơ sở dữ liệu
      let existingUser = await User.findOne({ googleId: user.googleId });
      if (!existingUser) {
        const email = user.email;
        if (!email) {
          return res.status(400).json({
            success: false,
            message: 'Không thể lấy email từ Google',
            code: 'MISSING_EMAIL',
          });
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
      await RefreshToken.updateOne({ userId }, { token: refreshToken, updatedAt: Date.now() }, { upsert: true });

      // Tạo URL để redirect về mobile app với tokens
      const redirectUrl = `${MOBILE_APP_URL}/auth/google/success?accessToken=${accessToken}&refreshToken=${refreshToken}&userId=${userId}`;

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('❌ Mobile Google Auth Error:', error);
      const errorUrl = `${MOBILE_APP_URL}/auth/google/error?message=${encodeURIComponent(error.message)}`;
      return res.redirect(errorUrl);
    }
  },

  // API để mobile app lấy thông tin user sau khi đăng nhập Google thành công
  getMobileGoogleUser: async (req, res) => {
    try {
      const { accessToken } = req.body;

      if (!accessToken) {
        return res.status(400).json({
          success: false,
          message: 'Access token is required',
          code: 'MISSING_ACCESS_TOKEN',
        });
      }

      // Verify access token
      jwt.verify(accessToken, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
          return res.status(403).json({
            success: false,
            message: 'Access token không hợp lệ',
            code: 'INVALID_ACCESS_TOKEN',
          });
        }

        const user = await User.findById(decoded._id).select('-password');
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy người dùng',
            code: 'USER_NOT_FOUND',
          });
        }

        const { googleId, ...others } = user.toObject();
        return res.status(200).json({
          success: true,
          message: 'Đăng nhập Google thành công',
          data: {
            ...others,
            hasPassword: !!user.password,
          },
        });
      });
    } catch (error) {
      console.error('❌ Get Mobile Google User Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thông tin đăng nhập',
        error: error.message,
        code: 'SYSTEM_ERROR',
      });
    }
  },

  // Liên kết tài khoản Google với tài khoản hiện tại (Mobile)
  linkGoogleAccount: async (req, res) => {
    try {
      const { userId, googleAccessToken } = req.body;

      if (!userId || !googleAccessToken) {
        return res.status(400).json({
          success: false,
          message: 'User ID và Google Access Token là bắt buộc',
          code: 'MISSING_REQUIRED_FIELDS',
        });
      }

      // Verify Google access token và lấy thông tin từ Google
      const googleResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${googleAccessToken}`,
      );
      const googleUser = await googleResponse.json();

      if (!googleUser.id) {
        return res.status(400).json({
          success: false,
          message: 'Google access token không hợp lệ',
          code: 'INVALID_GOOGLE_TOKEN',
        });
      }

      // Kiểm tra xem Google account đã được liên kết với tài khoản khác chưa
      const existingGoogleUser = await User.findOne({ googleId: googleUser.id });
      if (existingGoogleUser && existingGoogleUser._id.toString() !== userId) {
        return res.status(409).json({
          success: false,
          message: 'Tài khoản Google này đã được liên kết với tài khoản khác',
          code: 'GOOGLE_ACCOUNT_ALREADY_LINKED',
        });
      }

      // Cập nhật thông tin Google cho user hiện tại
      const user = await User.findByIdAndUpdate(
        userId,
        {
          googleId: googleUser.id,
          authProvider: 'both', // Có thể đăng nhập bằng cả email/password và Google
          avatar: user.avatar || googleUser.picture,
        },
        { new: true },
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
          code: 'USER_NOT_FOUND',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Liên kết tài khoản Google thành công',
        data: user,
      });
    } catch (error) {
      console.error('❌ Link Google Account Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi liên kết tài khoản',
        error: error.message,
        code: 'SYSTEM_ERROR',
      });
    }
  },

  // Hủy liên kết tài khoản Google (Mobile)
  unlinkGoogleAccount: async (req, res) => {
    try {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID là bắt buộc',
          code: 'MISSING_USER_ID',
        });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy người dùng',
          code: 'USER_NOT_FOUND',
        });
      }

      // Kiểm tra xem user có password không, nếu không thì không thể hủy liên kết Google
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: 'Không thể hủy liên kết Google vì tài khoản chưa có mật khẩu. Vui lòng tạo mật khẩu trước.',
          code: 'NO_PASSWORD_SET',
        });
      }

      // Hủy liên kết Google
      user.googleId = undefined;
      user.authProvider = 'local';
      await user.save();

      const updatedUser = await User.findById(userId).select('-password');

      return res.status(200).json({
        success: true,
        message: 'Hủy liên kết tài khoản Google thành công',
        data: updatedUser,
      });
    } catch (error) {
      console.error('❌ Unlink Google Account Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi hủy liên kết tài khoản',
        error: error.message,
        code: 'SYSTEM_ERROR',
      });
    }
  },
};

module.exports = mobileSocialController;
