const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { http, add } = require("winston");

let refreshTokens = {};

// Lưu refresh token với user
const addRefreshToken = (user, refreshToken) => {
  if (!refreshTokens[user._id]) {
    refreshTokens[user._id] = [];
  }
  refreshTokens[user._id].push(refreshToken);
};

// Xóa refresh token theo user
const removeSpecificToken = (user, refreshToken) => {
  if (!refreshTokens[user._id]) return;
  
  refreshTokens[user._id] = refreshTokens[user._id].filter(token => token !== refreshToken);

  if (refreshTokens[user._id].length === 0) {
    delete refreshTokens[user._id];
  }
};

const authController = {
// Tạo token JWT
  generateToken : (user) => {
    return jwt.sign(
      { 
        _id: user._id, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "30s" });
  },

// Tạo refresh token JWT
  generateRefreshToken : (user) => {
    return jwt.sign(
      { 
        _id: user._id, 
        role:user.role 
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "30d" });
  },

// Đăng ký
  registerUser: async (req, res) => {
    try {
      const { username, email, password,  confirmPassword} = req.body;

      // kiểm tra password với confirm password
      if (password !== confirmPassword) {
        return res.status(400).json({message: "Vui lòng nhập lại xác nhận mật khẩu"});
      }

      // Kiểm tra nếu thiếu thông tin
      if (!username || !email || !password) {
        return res.status(400).json({message: "Vui lòng nhập đầy đủ thông tin."});
      }


      // Kiểm tra email đã tồn tại chưa
      const userCheck = await User.findOne({username: username});
      if (userCheck) {
        return res.status(400).json({ err: "username", message: "username đã được sử dụng."});
      }
      
      const emailCheck = await User.findOne({email:email});
      if (emailCheck) {
        return res.status(400).json({ err: "email", message:"email đã được sử dụng."});
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
      res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
  },

// Đăng nhập
  loginUser:  async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username) {
        return res.status(400).json({ message: "Vui lòng nhập username"});
      }

      if (!password) {
        return res.status(400).json({ message: "Vui lòng nhập mật khẩu"});
      }

      const user = await User.findOne({ username: username }).select("+password");

      if (!user) {
        return res.status(401).json({ message: "USERNAME KHÔNG TỒN TẠI"});
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "SAI MẬT KHẨU"});
      }
      if(user && isMatch){
        const Token = authController.generateToken(user);
        const refreshToken = authController.generateRefreshToken(user);
        

        addRefreshToken(user, refreshToken);
        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false,
          path:"/",
          sameSite: "strict"
        })
    
        res.json({
          message: "Đăng nhập thành công",
          _id: user._id,
          fullname: user.fullname,
          username: user.username,
          email: user.email,
          role: user.role,
          address: user.address,
          Token,
        });
      }

    } catch (error) {
      console.error("❌ Lỗi đăng nhập:", error);
      res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
    }
  },

// lấy request Token
requestRefreshToken: async (req, res) => {
  const refreshToken = req.body.refreshToken || req.headers.authorization?.split(" ")[1]; // Nhận từ body hoặc header
  if (!refreshToken) return res.status(401).json({ message: "Vui lòng đăng nhập" });

  const userId = Object.keys(refreshTokens).find(userId => refreshTokens[userId].includes(refreshToken));
  if (!userId) return res.status(403).json({ message: "Refresh token không hợp lệ!" });

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
      if (err) {
          console.log(err);
          return res.status(403).json({ message: "Token hết hạn hoặc không hợp lệ!" });
      }

      removeSpecificToken(user, refreshToken);

      const newToken = authController.generateToken(user);
      const newRefreshToken = authController.generateRefreshToken(user);

      // Trả về refresh token thay vì set cookie
      return res.status(200).json({
          accessToken: newToken,
          refreshToken: newRefreshToken
      });
  });
},


// Logout
userLogout: async (req, res) => {
  const refreshToken = req.headers.authorization?.split(" ")[1]; // Lấy token từ header
  if (!refreshToken) {
      return res.status(400).json({ message: "Không có refresh token" });
  }

  const userId = Object.keys(refreshTokens).find(userId => refreshTokens[userId].includes(refreshToken));
  if (userId) {
      removeSpecificToken({ _id: userId }, refreshToken);
  }

  return res.status(200).json({ message: "Đăng xuất thành công" });
}

}

module.exports = authController;
