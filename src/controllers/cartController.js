const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    let cart = await Cart.findOne({ _idUser: userId }).populate({
      path: 'items._idProduct',
      select: 'name price images unit discount quantity',
    });

    if (!cart) {
      // Create a new cart if one doesn't exist
      cart = await Cart.create({
        _idUser: userId,
        items: [],
      });
    }

    // Calculate total price
    let totalPrice = 0;
    const cartItems = cart.items.map((item) => {
      const product = item._idProduct;
      const price = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;

      const itemTotal = price * item.quantity;
      totalPrice += itemTotal;

      return {
        product: {
          _id: product._id,
          name: product.name,
          price: product.price,
          discount: product.discount,
          unit: product.unit,
          actualPrice: price,
          images: product.images,
          inStock: product.quantity,
        },
        quantity: item.quantity,
        total: itemTotal,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        items: cartItems,
        totalPrice,
        itemCount: cart.items.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể lấy giỏ hàng',
      error: error.message,
    });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    // Check if product is in stock
    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm không đủ số lượng trong kho',
      });
    }

    // Find user's cart or create a new one
    let cart = await Cart.findOne({ _idUser: userId });
    if (!cart) {
      cart = await Cart.create({
        _idUser: userId,
        items: [],
      });
    }

    // Check if product already in cart
    const itemIndex = cart.items.findIndex((item) => item._idProduct.toString() === productId);

    if (itemIndex > -1) {
      // Product exists in cart, update quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Product not in cart, add it
      cart.items.push({
        _idProduct: productId,
        quantity,
      });
    }

    // Save cart
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Đã thêm sản phẩm vào giỏ hàng',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể thêm vào giỏ hàng',
      error: error.message,
    });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
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

    // Check product exists and has enough stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Sản phẩm không đủ số lượng trong kho',
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

    res.status(200).json({
      success: true,
      message: 'Đã cập nhật giỏ hàng',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật giỏ hàng',
      error: error.message,
    });
  }
};

// Remove item from cart
exports.removeCartItem = async (req, res) => {
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

    res.status(200).json({
      success: true,
      message: 'Đã xóa sản phẩm khỏi giỏ hàng',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể xóa sản phẩm khỏi giỏ hàng',
      error: error.message,
    });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ _idUser: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giỏ hàng',
      });
    }

    // Empty the cart
    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Đã xóa toàn bộ giỏ hàng',
      data: cart,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Không thể xóa giỏ hàng',
      error: error.message,
    });
  }
};
