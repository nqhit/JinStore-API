const Product = require('../models/Product');

module.exports = {
  //NOTE: Get all products
  getAllProducts: async (req, res) => {
    try {
      const products = await Product.find();
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
      console.log(product);
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

      const products = await Product.find({ _idCategory: idCategory });

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
      const { name, description, price, discount, stock, _idCategory, status, images } = req.body;

      if (!name || !price || !stock || !_idCategory) {
        return res.status(400).json({
          error: 'Thiếu dữ liệu',
          message: 'Vui lòng nhập đầy đủ thông tin.',
        });
      }

      const existingProduct = await Product.findOne({ name: name.trim() });
      if (existingProduct) {
        return res.status(400).json({
          success: false,
          message: 'Danh mục này đã tồn tại',
        });
      }

      const newProduct = new Product({
        name: name.trim(),
        description: description || '',
        price: price || 1,
        discount: discount || 0,
        stock: stock || 0,
        _idCategory: _idCategory || '',
        status: status || true,
        images: images || null,
      });
      const product = await newProduct.save();

      res.status(200).json(product);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  //NOTE:Update detail product
  editProduct: async (req, res) => {
    try {
      const { id } = req.params;
      const Product = await Product.findByIdAndUpdate(id, req.body, { new: true }).populate('_idCategory');

      if (!Product) {
        return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
      }

      res.status(200).json({ success: true, product: Product });
    } catch (error) {
      console.error('Lỗi server:', error);
      res.status(500).json({ message: 'Lỗi server', error });
    }
  },

  //NOTE: Delete product
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params;
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
