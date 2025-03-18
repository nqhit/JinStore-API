const Category = require('../models/Category');

module.exports = {
  //Get all category
  getAllCategory: async (req, res) => {
    try {
      const categories = await Category.find();
      res.status(200).json(categories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  //Get category
  getCategory: async (req, res) => {
    try {
      const {id} = req.params

      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ message: 'Danh mục không tồn tại' });
      }
      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error });
    }
  },

  //Create category
  createCategory: async (req, res) => {
    try {
      const { name, image } = req.body;
      if (!name || !image) {
        return res.status(400).json({ error: 'Thiếu dữ liệu', message: 'Vui lòng nhập đầy đủ thông tin.' });
      }
      const newCategory = await new Category(req.body);
      const category = await newCategory.save();
      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};
