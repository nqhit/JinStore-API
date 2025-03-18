const { query } = require('express');
const Product = require('../models/Product');

module.exports = {
  // Get all products
  getAllProducts: async (req, res) => {
    try {
      const products = await Product.find().populate('idCategory');
      if (products.length === 0) {
        return res.status(200).json({ message: 'Không có sản phẩm nào.' });
      }
      res.status(200).json(products);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get product by name
  getProductById: async (req, res) => {
    try {
      const { id } = req.params; // Lấy id từ query parameters

      if (!id) {
        return res.status(400).json({ message: 'Thiếu id sản phẩm' });
      }

      const product = await Product.findById(id).populate('idCategory');
      console.log(product);
      if (!product) {
        return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
      }

      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server', error });
    }
  },

  // Create new product
  createProduct: async (req, res) => {
    try {
      const { name, description, price, discount, stock, category, images } = req.body;

      if (!name || !description || !price || !discount || !stock || !category || !images) {
        return res.status(400).json({
          error: 'Thiếu dữ liệu',
          message: 'Vui lòng nhập đầy đủ thông tin.',
        });
      }

      const newProduct = new Product({ name, description, price, discount, stock, category, images });
      const product = await newProduct.save();

      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  //Update detail product
  editProduct: async (req, res) => {
    try {
      const id = req.params.id || req.query.id; // Lấy id từ params hoặc query
      const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true }).populate('idCategory');

      if (!updatedProduct) {
        return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
      }

      res.status(200).json({ success: true, product: updatedProduct });
    } catch (error) {
      console.error('Lỗi server:', error);
      res.status(500).json({ message: 'Lỗi server', error });
    }
  },

  // Delete product
  deleteProduct: async (req, res) => {
    try {
      const id = req.params.id;
      const deletedProduct = await Product.findByIdAndDelete(id);
      if (!deletedProduct) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
};
