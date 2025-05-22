const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const mongoose = require('mongoose');

module.exports = {
  // NOTE: [POST] /api/orders/create - Tạo đơn hàng mới
  createOrder: async (req, res) => {
    try {
      const { orderItems, shippingAddress, paymentMethod, totalAmount, note, source } = req.body;
      if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ message: 'Đơn hàng cần có ít nhất một sản phẩm' });
      }

      const order = new Order({
        _idUser: req.user._id,
        orderItems,
        shippingAddress,
        paymentMethod: paymentMethod.toLowerCase(),
        totalAmount,
        note,
      });

      const createdOrder = await order.save();

      const orderItem = createdOrder.orderItems.map((item) => ({
        _idProduct: item._idProduct,
        quantity: item.quantity,
      }));

      const productIds = orderItem.map((item) => item._idProduct);

      if (typeof source === 'string' && source.toLowerCase() === 'cart') {
        await Cart.updateOne(
          { _idUser: req.user._id },
          {
            $pull: {
              items: {
                _idProduct: { $in: productIds },
              },
            },
            $set: { updatedAt: new Date() },
          },
        );
      }

      // ✅ Trừ tồn kho từng sản phẩm theo số lượng
      for (const item of orderItem) {
        await Product.updateOne(
          { _id: item._idProduct },
          { $inc: { quantity: -item.quantity, countBuy: item.quantity } },
        );
      }

      res.status(201).json({ success: true, data: createdOrder });
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
  },

  //NOTE: [GET] /api/orders/status - Lấy đơn hàng theo trạng thái
  getOrdersStatus: async (req, res) => {
    const userId = req.user._id;
    const { status } = req.query; // Đổi từ req.body sang req.query

    try {
      const orders = await Order.find({ _idUser: userId }).populate({
        path: 'orderItems._idProduct',
        select: 'name price images unit discount quantity',
      });
      if (!orders || orders.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng!',
        });
      }

      if (status === 'all' || !status) {
        return res.status(200).json({ success: true, data: orders });
      }

      const dataOrders = orders.filter((order) => order.status === status);
      return res.status(200).json({ success: true, data: dataOrders });
    } catch (error) {
      console.error('Lỗi khi lấy đơn hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
  },
};
