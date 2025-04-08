const _user = require('../models/User');
const _refreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { http, add } = require('winston');

const authController = {
  //COMMENT: Tạo token JWT
  generateToken: (user) => {
    return jwt.sign(
      {
        _id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );
  },

  //COMMENT: Tạo refresh token JWT
  generateRefreshToken: (user) => {
    return jwt.sign(
      {
        _id: user._id,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' },
    );
  },

  //NOTE: Đăng ký
  registerUser: async (req, res) => {
    try {
      const { fullname, username, email, password, confirmPassword } = req.body;

      const fullnameRegex = /^[\p{L}\s]+$/u;
      if (!fullnameRegex.test(fullname)) {
        return res.status(400).json({ message: 'Tên người dùng không hợp lệ' });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Email không hợp lệ' });
      }

      if (!validator.isStrongPassword(password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1 })) {
        return res.status(400).json({ message: `Mật khẩu ít nhất 8 ký tự bao gồm chữ thường, in hoa, số` });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập lại xác nhận mật khẩu' });
      }

      if (!fullname || !username || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
      }

      const userCheck = await _user.findOne({ username: username });
      if (userCheck) {
        return res.status(400).json({ err: 'username', message: 'username đã được sử dụng.' });
      }

      const emailCheck = await _user.findOne({ email: email });
      if (emailCheck) {
        return res.status(400).json({ err: 'email', message: 'email đã được sử dụng.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const normalizedEmail = email.trim();

      const newUser = await new _user({
        fullname: fullname,
        username: username,
        email: normalizedEmail,
        password: hashedPassword,
      });

      const user = await newUser.save();
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
    }
  },

  //NOTE: Đăng nhập
  loginUser: async (req, res) => {
    try {
      const { usernameOrEmail, password } = req.body;

      if (!usernameOrEmail) {
        return res.status(400).json({ message: 'Vui lòng nhập username' });
      }

      if (!password) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu' });
      }

      const user = await _user
        .findOne({
          $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }],
        })
        .select('+password')
        .lean();

      if (!user) {
        return res.status(401).json({ message: 'USERNAME KHÔNG TỒN TẠI' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'SAI MẬT KHẨU' });
      }
      if (user && isMatch) {
        const accessToken = authController.generateToken(user);
        const refreshToken = authController.generateRefreshToken(user);

        const userId = user._id;
        const userRefreshToken = await _refreshToken.findOne({ userId: userId });

        if (userRefreshToken) {
          await _refreshToken.findByIdAndUpdate(userRefreshToken._id, { token: refreshToken }, { new: true });
        } else {
          await new _refreshToken({ token: refreshToken, userId: userId }).save();
        }

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: false,
          path: '/',
          sameSite: 'strict',
        });

        const { password, ...others } = user;
        res.status(200).json({ ...others, accessToken });
      }
    } catch (error) {
      console.error('❌ Lỗi đăng nhập:', error);
      res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
    }
  },

  //NOTE: lấy request Token
  requestRefreshToken: async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    console.log('Received Refresh Token:', refreshToken);

    if (!refreshToken) return res.status(401).json("Your're not authenticated");

    const storedToken = await _refreshToken.findOne({ token: refreshToken });
    if (!storedToken) return res.status(403).json('Refresh token is not valid');

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, user) => {
      if (err) {
        console.log(err);
      }
      await _refreshToken.deleteOne({ token: refreshToken });

      const newAccessToken = authController.generateToken(user);
      const newRefreshToken = authController.generateRefreshToken(user);

      await new _refreshToken({ token: newRefreshToken, userId: user._id }).save();

      return res
        .cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: false,
          path: '/',
          sameSite: 'strict',
        })
        .status(200)
        .json({
          accessToken: newAccessToken,
        });
    });
  },

  //NOTE: Logout
  userLogout: async (req, res) => {
    try {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ message: 'User ID is required' });
      }

      // Xóa refreshToken từ database
      await _refreshToken.deleteOne({ userId: id });

      // Xóa cookie và gửi response
      return res
        .clearCookie('refreshToken', {
          httpOnly: true,
          secure: false,
          path: '/',
          sameSite: 'strict',
        })
        .status(200)
        .json({
          success: true,
          message: 'Đăng xuất thành công!',
        });
    } catch (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Có lỗi khi đăng xuất',
        error: err.message,
      });
    }
  },
};

module.exports = authController;
