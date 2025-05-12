const mongoose = require('mongoose');

// Schema cho từng sản phẩm trong đơn hàng
const orderItemSchema = new mongoose.Schema(
  {
    _idProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

// Schema cho đơn hàng
const orderSchema = new mongoose.Schema(
  {
    _idUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    orderItems: {
      type: [orderItemSchema],
      validate: [(val) => val.length > 0, 'Đơn hàng phải có ít nhất một sản phẩm'],
    },

    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Address',
      required: true,
    },

    // Thay thế phương thức thanh toán cũ bằng tham chiếu đến PaymentMethod
    paymentMethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      required: true,
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    paidAt: {
      type: Date,
    },

    status: {
      type: String,
      required: true,
      enum: ['Chờ xác nhận', 'Đang xử lý', 'Đã giao hàng', 'Đã hủy'],
      default: 'Chờ xác nhận',
    },

    note: {
      type: String,
    },
  },
  {
    timestamps: true, // createdAt và updatedAt tự động
  },
);

// Tính tổng tiền nếu chưa có
orderSchema.pre('save', function (next) {
  if (!this.isModified('orderItems') && this.totalPrice) return next();

  const itemsTotal = this.orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  this.totalPrice = itemsTotal;
  next();
});

module.exports = mongoose.model('Order', orderSchema);
