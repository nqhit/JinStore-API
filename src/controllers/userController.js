const User = require('../models/User');

module.exports = {
  //NOTE: Get all user
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  //NOTE: Get information user
  getUserInfo: async (req, res) => {
    try {
      const { id } = req.params;
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

  //NOTE: Update information user
  updateUserInfo: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndUpdate(id, { fullname, sex, dateBirth }, { new: true });

      if (!user) {
        return res.status(404).json({ message: 'Người dùng này không tồn tại' });
      }

      res.status(200).json({ success: true, user: user });
    } catch (error) {
      console.error('Lỗi server:', error);
      res.status(500).json({ message: 'Lỗi server', error });
    }
  },

  //NOTE: Update address user =>  Delivery address
  updateDeliveryAddress: async (req, res) => {
    try {
      const { id } = req.params;
      const { street, city, district, ward } = req.body;
      const user = await User.findByIdAndUpdate(id, { street, city, district, ward }, { new: true });

      if (!user) {
        return res.status(404).json({ message: 'Người dùng này không tồn tại' });
      }

      res.status(200).json({ success: true, user: user });
    } catch (error) {
      console.error('Lỗi server:', error);
      res.status(500).json({ message: 'Lỗi server', error });
    }
  },

  //NOTE: Update password
  updatePassword: async (req, res) => {
    
  },

  //NOTE: Delete user
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
