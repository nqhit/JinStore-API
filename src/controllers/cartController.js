const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

const calculateActualPrice = (product) => {
  return product.price * (1 - product.discount / 100);
};

const formatProductData = (product) => {
  const actualPrice = calculateActualPrice(product);

  return {
    _id: product._id,
    name: product.name,
    price: product.price,
    discount: product.discount,
    unit: product.unit,
    actualPrice,
    images: product.images,
  };
};

const findOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ _idUser: userId }).populate({
    path: 'items._idProduct',
    select: 'name price images unit discount quantity',
  });

  if (!cart) {
    cart = await Cart.create({
      _idUser: userId,
      items: [],
    });
  }

  return cart;
};

const validateProduct = async (productId, quantity) => {
  const product = await Product.findById(productId);

  if (!product) {
    return { valid: false, message: 'Không tìm thấy sản phẩm' };
  }

  if (quantity > 0 && product.quantity < quantity) {
    return { valid: false, message: 'Sản phẩm không đủ số lượng trong kho' };
  }

  return { valid: true, product };
};

module.exports = {
  // Get user's cart
  getCart: async (req, res) => {
    try {
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      const cart = await findOrCreateCart(userId);
      if (!cart.items.length) {
        return res.status(200).json({
          success: true,
          message: 'Giỏ hàng trống',
          data: {
            items: [],
            totalPrice: 0,
            itemCount: 0,
          },
        });
      }

      let totalPrice = 0;
      const cartItems = cart.items
        .map((item) => {
          const product = item._idProduct;
          if (!product) {
            return null; // Bỏ qua sản phẩm không hợp lệ
          }
          const actualPrice = calculateActualPrice(product);
          const itemTotal = Number((actualPrice * item.quantity).toFixed(2)); // Làm tròn 2 chữ số
          totalPrice += itemTotal;

          const { ...otherProductData } = formatProductData(product);
          return {
            ...otherProductData,
            quantity: item.quantity,
            total: itemTotal,
          };
        })
        .filter((item) => item !== null); // Lọc bỏ các mục không hợp lệ

      // Thêm return ở đây để tránh tiếp tục thực thi code sau khi response đã được gửi
      return res.status(200).json({
        success: true,
        data: cartItems,
        itemCount: cartItems.length,
        totalPrice: Number(totalPrice.toFixed(2)), // Thêm tổng giá để UI có thể sử dụng
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Không thể lấy giỏ hàng',
        error: error.message,
      });
    }
  },

  // Add item to cart
  addToCart: async (req, res) => {
    try {
      const { productId, quantity = 1 } = req.body;
      const userId = req.user._id;

      // Validate product
      const { valid, message, product } = await validateProduct(productId, quantity);
      if (!valid) {
        return res.status(404).json({
          success: false,
          message,
        });
      }

      // Find or create cart
      const cart = await findOrCreateCart(userId);

      // Check if product already in cart
      const itemIndex = cart.items.findIndex((item) => item._idProduct._id.toString() === productId.toString());
      console.log(itemIndex);
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({
          _idProduct: productId,
          quantity,
        });
      }

      // Save cart
      await cart.save();

      return res.status(200).json({
        success: true,
        message: 'Đã thêm sản phẩm vào giỏ hàng',
        data: cart,
        itemCount: cart.items.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Không thể thêm vào giỏ hàng',
        error: error.message,
      });
    }
  },

  // Update cart item quantity
  updateCartItem: async (req, res) => {
    try {
      const { productId, quantity } = req.body;
      const userId = req.user._id;

      // Validate inputs
      if (!productId || !quantity) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu thông tin sản phẩm hoặc số lượng',
        });
      }

      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Số lượng phải lớn hơn 0',
        });
      }

      // Validate product
      const { valid, message, product } = await validateProduct(productId, quantity);
      if (!valid) {
        return res.status(404).json({
          success: false,
          message,
        });
      }

      // Update cart
      const cart = await Cart.findOne({ _idUser: userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy giỏ hàng',
        });
      }

      const itemIndex = cart.items.findIndex((item) => item._idProduct.toString() === productId);

      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Sản phẩm không có trong giỏ hàng',
        });
      }

      // Update quantity
      cart.items[itemIndex].quantity = quantity;
      await cart.save();

      return res.status(200).json({
        success: true,
        message: 'Đã cập nhật giỏ hàng',
        data: cart,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Không thể cập nhật giỏ hàng',
        error: error.message,
      });
    }
  },

  // Remove item from cart
  removeCartItem: async (req, res) => {
    try {
      const { productId } = req.params;
      const userId = req.user._id;

      const cart = await Cart.findOne({ _idUser: userId });
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy giỏ hàng',
        });
      }

      // Remove item from cart
      cart.items = cart.items.filter((item) => item._idProduct.toString() !== productId);

      await cart.save();

      return res.status(200).json({
        success: true,
        message: 'Đã xóa sản phẩm khỏi giỏ hàng',
        data: cart,
        itemCount: cart.items.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Không thể xóa sản phẩm khỏi giỏ hàng',
        error: error.message,
      });
    }
  },

  // Clear cart
  clearCart: async (req, res) => {
    try {
      const userId = req.user._id;

      const result = await Cart.findOneAndUpdate({ _idUser: userId }, { $set: { items: [] } }, { new: true });

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy giỏ hàng',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Đã xóa toàn bộ giỏ hàng',
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Không thể xóa giỏ hàng',
        error: error.message,
      });
    }
  },
};
