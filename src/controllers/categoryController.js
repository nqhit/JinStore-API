const Category = require('../models/Category');
const { uploadImage, deleteImage } = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
      console.log('🔍 Fetching all categories...');
      const categories = await Category.find();
      console.log(`✅ Found ${categories.length} categories`);

      // Log the first category for debugging
      if (categories.length > 0) {
        console.log('📝 First category:', JSON.stringify(categories[0], null, 2));
      }

      res.json(categories);
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  },

  //NOTE: Get category
  getCategory: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`🔍 Fetching category with ID: ${id}`);

      const category = await Category.findById(id);
      if (!category) {
        console.log(`❌ Category not found with ID: ${id}`);
        return res.status(404).json({ message: 'Danh mục không tồn tại' });
      }

      console.log(`✅ Found category: ${category.name}`);
      res.status(200).json(category);
    } catch (error) {
      console.error('❌ Error fetching category:', error);
      res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
  },

  //NOTE: Create category
  createCategory: async (req, res) => {
    try {
      const { name, slug, description } = req.body;
      const newId = await getNextCategoryId();
      let imageData = { url: '', publicId: '' };

      // Kiểm tra tên danh mục
      if (!name || name.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Tên danh mục là bắt buộc',
        });
      }

      const trimmedName = name.trim();

      // Kiểm tra danh mục đã tồn tại theo tên (không phân biệt hoa thường)
      const existingCategory = await Category.findOne({
        name: { $regex: `^${trimmedName}$`, $options: 'i' },
      });
      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: 'Danh mục này đã tồn tại',
        });
      }

      const checkSlug = await Category.findOne({ slug: slug });
      if (checkSlug) {
        return res.status(409).json({ success: false, message: 'Slug đã tồn tại!' });
      }

      // Handle image upload if provided
      if (req.file) {
        try {
          // Upload to Cloudinary
          const result = await uploadImage(req.file.path);
          imageData = {
            url: result.secure_url,
            publicId: result.public_id,
          };

          // Clean up the temporary file
          fs.unlinkSync(req.file.path);
        } catch (uploadError) {
          console.error('Error uploading image:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải ảnh lên Cloudinary',
          });
        }
      }

      // Tạo danh mục mới
      const newCategory = new Category({
        _id: newId,
        name: trimmedName,
        slug: slug,
        description: description || '',
        image: imageData,
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
      const { name, slug, description, isOutstanding, status } = req.body;
      const { id } = req.params;
      const category = await Category.findOne({ _id: id });

      if (!category) {
        return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
      }

      if (name) {
        const trimmedName = name.trim();
        // Kiểm tra danh mục đã tồn tại theo tên (không phân biệt hoa thường)
        const existingCategory = await Category.findOne({
          name: { $regex: `^${trimmedName}$`, $options: 'i' },
        });
        if (existingCategory && existingCategory._id !== id) {
          return res.status(409).json({
            success: false,
            message: 'Danh mục này đã tồn tại',
          });
        }
      }

      if (slug) {
        const checkSlug = await Category.findOne({ slug: slug });
        if (checkSlug && checkSlug._id !== id) {
          return res.status(409).json({ success: false, message: 'Slug đã tồn tại!' });
        }
      }

      // Handle image upload if provided
      if (req.file) {
        try {
          // Delete old image from Cloudinary if exists
          if (category.image && category.image.publicId) {
            await deleteImage(category.image.publicId);
          }

          // Upload new image to Cloudinary
          const result = await uploadImage(req.file.path);
          category.image = {
            url: result.secure_url,
            publicId: result.public_id,
          };

          // Clean up the temporary file
          fs.unlinkSync(req.file.path);
        } catch (uploadError) {
          console.error('Error handling image:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Lỗi khi xử lý ảnh',
          });
        }
      }

      // Cập nhật các trường khác
      if (name) category.name = trimmedName;
      if (slug) category.slug = slug;
      if (description) category.description = description;
      if (isOutstanding !== undefined) category.isOutstanding = isOutstanding;
      if (status) category.status = status;

      await category.save();
      res.json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  //NOTE: Delete category
  deleteCategory: async (req, res) => {
    try {
      const { id } = req.params;
      const category = await Category.findById(id);

      if (!category) {
        return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
      }

      // Delete image from Cloudinary if exists
      if (category.image && category.image.publicId) {
        try {
          await deleteImage(category.image.publicId);
        } catch (deleteError) {
          console.error('Error deleting image from Cloudinary:', deleteError);
          // Continue with category deletion even if image deletion fails
        }
      }

      await Category.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: 'Xóa danh mục thành công.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Xóa danh mục thất bại!' });
    }
  },
};
