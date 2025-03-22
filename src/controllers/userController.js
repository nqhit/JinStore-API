const User = require('../models/User');

module.exports = {
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getUserInfo: async (req, res) => {
    try {
      const { id } = req.params; // Lấy id từ req.params
      if (!id) {
        return res.status(400).json({ message: 'Vui lòng cung cấp ID người dùng' });
      }

      const infoUser = await User.findById(id);
      if (!infoUser) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
      }

      res.status(200).json({
        message: 'Thông tin người dùng',
        _id: infoUser._id,
        fullname: infoUser.fullname,
        username: infoUser.username,
        email: infoUser.email,
        address: infoUser.address,
      });
    } catch (error) {
      res.status(500).json({
        message: 'Lỗi server',
        error: error.message, // Trả về thông tin lỗi để debug
      });
    }
  },

  updateUserInfo: async (req, res) => {
    try {
      const id = req.params.id;
      const user = await User.findByIdAndUpdate(id, req.body, { new: true });

      if (!user) {
        return res.status(404).json({ message: 'Người dùng này không tồn tại' });
      }

      res.status(200).json({ success: true, user: user });
    } catch (error) {
      console.error('Lỗi server:', error);
      res.status(500).json({ message: 'Lỗi server', error });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params.id;
      const deletedUser = await User.findByIdAndDelete(id);
      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};
