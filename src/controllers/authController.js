const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { http, add } = require('winston');

const authController = {
  // Tạo token JWT
  generateToken: (user) => {
    return jwt.sign(
      {
        _id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
    );
  },

  // Tạo refresh token JWT
  generateRefreshToken: (user) => {
    return jwt.sign(
      {
        _id: user._id,
        role: user.role,
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' },
    );
  },

  // Đăng ký
  registerUser: async (req, res) => {
    try {
      const { username, email, password, confirmPassword } = req.body;

      // kiểm tra password với confirm password
      if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập lại xác nhận mật khẩu' });
      }

      // Kiểm tra nếu thiếu thông tin
      if (!username || !email || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin.' });
      }

      // Kiểm tra email đã tồn tại chưa
      const userCheck = await User.findOne({ username: username });
      if (userCheck) {
        return res.status(400).json({ err: 'username', message: 'username đã được sử dụng.' });
      }

      const emailCheck = await User.findOne({ email: email });
      if (emailCheck) {
        return res.status(400).json({ err: 'email', message: 'email đã được sử dụng.' });
      }

      // Băm mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);
      const normalizedEmail = email.trim();
      // Tạo người dùng mới
      const newUser = await new User({
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

  // Đăng nhập
  loginUser: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username) {
        return res.status(400).json({ message: 'Vui lòng nhập username' });
      }

      if (!password) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu' });
      }

      const user = await User.findOne({ username: username }).select('+password');

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
        const userRefreshToken = await RefreshToken.findOne({ userId: userId });

        if (userRefreshToken) {
          await RefreshToken.findByIdAndUpdate(userRefreshToken._id, { token: refreshToken }, { new: true });
        } else {
          await new RefreshToken({ token: refreshToken, userId: userId }).save();
        }

        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: false,
          path: '/',
          sameSite: 'strict',
        });

        res.json({
          message: 'Đăng nhập thành công',
          _id: user._id,
          fullname: user.fullname,
          username: user.username,
          email: user.email,
          role: user.role,
          address: user.address,
          accessToken,
        });
      }
    } catch (error) {
      console.error('❌ Lỗi đăng nhập:', error);
      res.status(500).json({ message: 'Lỗi hệ thống', error: error.message });
    }
  },

  // lấy request Token
  requestRefreshToken: async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    console.log('Received Refresh Token:', refreshToken);

    if (!refreshToken) return res.status(401).json("Your're not authenticated");

    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken) return res.status(403).json('Refresh token is not valid');

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, user) => {
      if (err) {
        console.log(err);
      }
      await RefreshToken.deleteOne({ token: refreshToken });

      const newAccessToken = authController.generateToken(user);
      const newRefreshToken = authController.generateRefreshToken(user);

      await new RefreshToken({ token: newRefreshToken, userId: user._id }).save();

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: false,
        path: '/',
        sameSite: 'strict',
      });
      res.status(200).json({ accessToken: newAccessToken });
    });
  },

  // Logout
  userLogout: async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) return res.status(401).json("You're not authenticated");

      // Xóa refresh token khỏi DB
      await RefreshToken.findOneAndDelete({ token: refreshToken });

      // Xóa cookie
      res.clearCookie('refreshToken');
      res.status(200).json('Logged out successfully!');
    } catch (err) {
      res.status(500).json(err);
    }
  },
};

module.exports = authController;
