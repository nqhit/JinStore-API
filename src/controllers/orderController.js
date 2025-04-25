const Order = require('../models/Order');

module.exports = {
  //NOTE: [POST] /api/orders - Tạo đơn hàng mới
  createOrder: async (req, res) => {
    try {
      const { orderItems, shippingAddress, paymentMethod, shippingFee, note } = req.body;

      if (!orderItems || orderItems.length === 0) {
        return res.status(400).json({ message: 'Đơn hàng cần có ít nhất một sản phẩm' });
      }

      // Tính tổng tiền
      const itemsTotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const totalPrice = itemsTotal + (shippingFee || 0);

      const order = new Order({
        user: req.user._id,
        orderItems,
        shippingAddress,
        paymentMethod,
        shippingFee: shippingFee || 0,
        totalPrice,
        note,
      });

      const createdOrder = await order.save();
      res.status(201).json(createdOrder);
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
  },

  //NOTE: [GET] /api/orders - Lấy tất cả đơn hàng (chỉ Admin)
  getAllOrders: async (req, res) => {
    try {
      // Kiểm tra quyền admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Không có quyền truy cập' });
      }

      const orders = await Order.find().populate('user', 'name email phone').sort('-createdAt');

      res.json(orders);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách đơn hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
  },

  //NOTE: [GET] /api/orders/my-orders - Lấy đơn hàng của người dùng đăng nhập
  getMyOrders: async (req, res) => {
    try {
      const orders = await Order.find({ user: req.user._id }).sort('-createdAt');

      res.json(orders);
    } catch (error) {
      console.error('Lỗi khi lấy đơn hàng của người dùng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
  },

  //NOTE: [GET] /api/orders/:id - Lấy đơn hàng theo ID
  getOrderById: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id)
        .populate('user', 'name email phone')
        .populate('orderItems.product', 'name price image');

      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      // Kiểm tra quyền truy cập (chỉ admin hoặc người dùng tạo đơn hàng)
      if (!req.user.isAdmin && order.user._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Không có quyền truy cập đơn hàng này' });
      }

      res.json(order);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin đơn hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
  },

  //NOTE [PATCH] /api/orders/:id/pay - Cập nhật trạng thái thanh toán
  updateOrderToPaid: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      // Chỉ admin mới có thể cập nhật trạng thái thanh toán
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Không có quyền cập nhật' });
      }

      order.isPaid = true;
      order.paidAt = Date.now();

      // Cập nhật trạng thái đơn hàng
      if (order.status === 'Chờ xác nhận') {
        order.status = 'Đang xử lý';
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái thanh toán:', error);
      res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
  },

  //NOTE: [PATCH] /api/orders/:id/deliver - Cập nhật trạng thái giao hàng
  updateOrderToDelivered: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      // Chỉ admin mới có thể cập nhật trạng thái giao hàng
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Không có quyền cập nhật' });
      }

      order.isDelivered = true;
      order.deliveredAt = Date.now();
      order.status = 'Đã giao hàng';

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái giao hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
  },

  //NOTE: [PATCH] /api/orders/:id/status - Cập nhật trạng thái đơn hàng
  updateOrderStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      // Chỉ admin mới có thể cập nhật trạng thái
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Không có quyền cập nhật' });
      }

      // Kiểm tra trạng thái hợp lệ
      const validStatus = ['Chờ xác nhận', 'Đang xử lý', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'];
      if (!validStatus.includes(status)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
      }

      // Nếu chuyển sang trạng thái Đã giao hàng, cập nhật isDelivered
      if (status === 'Đã giao hàng' && !order.isDelivered) {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }

      order.status = status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
  },

  //NOTE: [DELETE] /api/orders/:id - Xóa đơn hàng
  deleteOrder: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      // Chỉ admin mới có quyền xóa đơn hàng
      if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Không có quyền xóa đơn hàng' });
      }

      // Không cho phép xóa đơn hàng đang giao hoặc đã giao
      if (order.status === 'Đang giao hàng' || order.status === 'Đã giao hàng') {
        return res.status(400).json({
          message: 'Không thể xóa đơn hàng đang giao hoặc đã giao',
        });
      }

      await Order.findByIdAndDelete(req.params.id);
      res.json({ message: 'Đã xóa đơn hàng' });
    } catch (error) {
      console.error('Lỗi khi xóa đơn hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
  },

  //NOTE: [PUT] /api/orders/:id/cancel - Hủy đơn hàng (cho khách hàng)
  cancelOrder: async (req, res) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }

      // Kiểm tra quyền (chỉ người tạo đơn hàng)
      if (order.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Không có quyền hủy đơn hàng này' });
      }

      // Chỉ có thể hủy đơn hàng ở trạng thái "Chờ xác nhận" hoặc "Đang xử lý"
      if (order.status !== 'Chờ xác nhận' && order.status !== 'Đang xử lý') {
        return res.status(400).json({
          message: 'Chỉ có thể hủy đơn hàng chưa được giao',
        });
      }

      order.status = 'Đã hủy';
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } catch (error) {
      console.error('Lỗi khi hủy đơn hàng:', error);
      res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
    }
  },
};
