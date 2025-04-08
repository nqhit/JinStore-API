const Category = require('../models/Category');

const getNextCategoryId = async () => {
  try {
    const lastCategory = await Category.findOne().sort({ _id: -1 });

    const lastId = lastCategory ? parseInt(lastCategory._id.split('-')[1]) : 0;

    return `CAT-${String(lastId + 1).padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating category ID:', error);
    throw error;
  }
};

module.exports = {
  //NOTE: Get all category
  getAllCategory: async (req, res) => {
    try {
      const categories = await Category.find();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  //NOTE: Get category
  getCategory: async (req, res) => {
    try {
      const { id } = req.params;

      const category = await Category.findById(id);
      if (!category) {
        return res.status(404).json({ message: 'Danh mục không tồn tại' });
      }
      res.status(200).json(category);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error });
    }
  },

  //NOTE: Create category
  createCategory: async (req, res) => {
    try {
      const { name, description, image } = req.body;
      const newId = await getNextCategoryId();

      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục là bắt buộc',
        });
      }

      const existingCategory = await Category.findOne({ name: name.trim() });
      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Danh mục này đã tồn tại',
        });
      }

      const newCategory = new Category({
        _id: newId,
        name: name.trim(),
        description: description || '',
        image: image || null,
      });

      const savedCategory = await newCategory.save();

      res.status(201).json({
        success: true,
        data: savedCategory,
      });
    } catch (error) {
      console.error('Lỗi:', error);
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra, vui lòng thử lại',
      });
    }
  },

  //NOTE: Update category
  updateCategory: async (req, res) => {
    try {
      const { name, description, isOutstanding, status, image, parentId } = req.body;
      const { id } = req.params;
      const category = await Category.findOne({ _id: id });

      if (!category) {
        return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
      }

      if (name) category.name = name;
      if (description) category.description = description;
      if (isOutstanding !== undefined) category.isOutstanding = isOutstanding;
      if (status) category.status = status;
      if (image) category.image = image;
      if (parentId !== undefined) category.parentId = parentId || null;

      await category.save();
      res.json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  //NOTE: Delete category
  deleteCategory: async (req, res) => {
    try {
      const category = await Category.findByIdAndDelete(req.params.id);
      if (category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
};
