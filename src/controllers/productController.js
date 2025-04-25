const Product = require('../models/Product');
const { uploadImage, deleteImage } = require('../utils/cloudinary');
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = {
  //NOTE: Get all products
  getAllProducts: async (req, res) => {
    try {
      const products = await Product.find().populate('_idCategory');
      if (products.length === 0) {
        return res.status(200).json({ message: 'Không có sản phẩm nào.' });
      }
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  //NOTE: Get product by name
  getProductById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: 'Thiếu id sản phẩm' });
      }

      const product = await Product.findById(id).populate('_idCategory');
      if (!product) {
        return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
      }

      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error });
    }
  },

  //NOTE: Get product by category
  getProductByIdCategory: async (req, res) => {
    try {
      const { idCategory } = req.params;

      if (!idCategory) {
        return res.status(400).json({ message: 'ID danh mục không hợp lệ!' });
      }

      const products = await Product.find({ _idCategory: idCategory })
        .populate('_idCategory') // Chỉ lấy các trường cần thiết từ Category
        .populate({
          path: '_idReview',
          match: { isApproved: true }, // Chỉ lấy các đánh giá đã được duyệt
          select: 'rating comment user createdAt', // Chỉ lấy các trường cần thiết từ Review
          populate: {
            path: 'user',
            select: 'username email', // Lấy thông tin người dùng (tùy chọn)
          },
        });

      if (!products || products.length === 0) {
        return res.status(404).json({ message: 'Sản phẩm không tồn tại!' });
      }

      return res.status(200).json(products);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Lỗi server', error });
    }
  },

  //NOTE: Create new product
  createProduct: async (req, res) => {
    try {
      const { name, description, price, unit, discount, quantity, _idCategory, information } = req.body;
      const trimmedName = name.trim();
      let imagesData = [];

      //NOTE: Kiểm tra thông tin sản phẩm
      if (!trimmedName || !price || !quantity || !_idCategory || !unit) {
        return res.status(400).json({
          success: false,
          error: 'Thiếu dữ liệu',
          message: 'Vui lòng nhập đầy đủ thông tin.',
        });
      }

      // NOTE: Kiểm tra tên sản phẩm
      const existingProduct = await Product.findOne({ name: { $regex: `^${trimmedName}$`, $options: 'i' } });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          error: 'Tên sản phẩm đã tồn tại',
          message: 'Vui lòng nhập tên sản phẩm khác',
        });
      }

      // NOTE: Tải nhiều ảnh lên nếu có
      if (req.files && req.files.length > 0) {
        try {
          // Upload tất cả ảnh lên Cloudinary
          const uploadPromises = req.files.map((file) => uploadImage(file.path, `products/${_idCategory}`));
          const uploadResults = await Promise.all(uploadPromises);

          // Tạo mảng đối tượng ảnh theo đúng schema
          imagesData = uploadResults.map((result) => ({
            url: result.secure_url,
            publicId: result.public_id,
          }));

          // Xóa tất cả các file tạm
          req.files.forEach((file) => {
            fs.unlinkSync(file.path);
          });
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          return res.status(500).json({
            success: false,
            message: 'Lỗi khi tải ảnh lên Cloudinary',
          });
        }
      }

      //NOTE: Kiểm tra và chuyển JSON sang đối tượng JavaScript
      let parsedInformation = [];
      if (information) {
        try {
          parsedInformation = typeof information === 'string' ? JSON.parse(information) : information;

          // Kiểm tra cấu trúc của information
          if (!Array.isArray(parsedInformation) || !parsedInformation.every((item) => item.key && item.value)) {
            return res.status(400).json({
              success: false,
              message: 'Thông tin sản phẩm phải là mảng các đối tượng có từ khóa và thông tin',
            });
          }
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: 'Thông tin sản phẩm (information) không hợp lệ',
          });
        }
      }

      const newProduct = new Product({
        name: trimmedName,
        description: description || '',
        price: price || 0,
        unit: unit || '',
        discount: discount || 0,
        quantity: quantity || 0,
        _idCategory: _idCategory,
        isActive: true,
        images: imagesData,
        information: parsedInformation,
      });

      const savedProduct = await newProduct.save();

      res.status(200).json({
        success: true,
        data: savedProduct,
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  //NOTE:Update detail product
  editProduct: async (req, res) => {
    try {
      const { name, description, price, discount, quantity, _idCategory, isActive, information, imagesToDelete } =
        req.body;
      const { id } = req.params;
      const _product = await Product.findById(id).populate('_idCategory');

      if (!_product) {
        return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
      }

      // Xử lý danh sách ảnh cần xóa
      let parsedImagesToDelete = [];
      if (imagesToDelete) {
        try {
          parsedImagesToDelete = typeof imagesToDelete === 'string' ? JSON.parse(imagesToDelete) : imagesToDelete;
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: 'Danh sách ảnh cần xóa (imagesToDelete) không hợp lệ',
          });
        }

        // Xóa ảnh khỏi Cloudinary và cập nhật mảng images
        for (const publicId of parsedImagesToDelete) {
          try {
            await deleteImage(publicId);
            _product.images = _product.images.filter((img) => img.publicId !== publicId);
          } catch (deleteError) {
            console.error(`Error deleting image ${publicId}:`, deleteError);
            // Tiếp tục xử lý các ảnh khác, không dừng lại
          }
        }
      }

      // Xử lý ảnh mới từ req.files
      if (req.files && req.files.length > 0) {
        const newImages = [];
        for (const file of req.files) {
          try {
            const result = await uploadImage(file.path, 'products');
            newImages.push({
              url: result.secure_url,
              publicId: result.public_id,
            });
            fs.unlinkSync(file.path); // Xóa file tạm
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            // Tiếp tục với các file khác
          }
        }
        _product.images = [...(_product.images || []), ...newImages];
      }

      let parsedInformation = [];
      if (information) {
        try {
          parsedInformation = typeof information === 'string' ? JSON.parse(information) : information;
        } catch (err) {
          return res.status(400).json({
            success: false,
            message: 'Thông tin sản phẩm (information) không hợp lệ',
          });
        }
      }

      if (name) _product.name = name.trim();
      if (description) _product.description = description;
      if (price) _product.price = price;
      if (discount) _product.discount = discount;
      if (quantity) _product.quantity = quantity;
      if (_idCategory) _product._idCategory = _idCategory;
      if (isActive) _product.isActive = isActive;
      if (information) _product.information = Array.isArray(parsedInformation) ? parsedInformation : [];
      await _product.save();
      res.status(200).json({ success: true, data: _product });
    } catch (error) {
      console.error('Lỗi server:', error);
      res.status(500).json({ message: 'Lỗi server', error });
    }
  },

  //NOTE: Delete product
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      if (product.images && product.images.publicId) {
        try {
          await deleteImage(product.images.publicId);
        } catch (deleteError) {
          console.error('Error deleting image from Cloudinary:', deleteError);
          // Continue with Product deletion even if image deletion fails
        }
      }
      await Product.findByIdAndDelete(id);
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};
