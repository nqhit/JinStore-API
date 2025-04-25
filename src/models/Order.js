const mongoose = require('mongoose');

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
  { _id: false }, // tránh tạo _id cho từng item
);

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

    paymentMethod: {
      type: String,
      required: true,
      enum: ['Tiền mặt khi nhận hàng', 'Chuyển khoản ngân hàng', 'Ví điện tử'],
    },

    shippingFee: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
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

    isDelivered: {
      type: Boolean,
      default: false,
    },

    deliveredAt: {
      type: Date,
    },

    status: {
      type: String,
      required: true,
      enum: ['Chờ xác nhận', 'Đang xử lý', 'Đang giao hàng', 'Đã giao hàng', 'Đã hủy'],
      default: 'Chờ xác nhận',
    },

    note: {
      type: String,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  },
);

// Middleware để tính totalPrice nếu không được cung cấp
orderSchema.pre('save', function (next) {
  if (!this.isModified('orderItems') && this.totalPrice) {
    return next();
  }

  // Tính tổng giá từ các mục hàng
  if (this.orderItems && this.orderItems.length > 0) {
    const itemsTotal = this.orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // Tính tổng tiền bao gồm phí vận chuyển
    this.totalPrice = itemsTotal + this.shippingFee;
  }

  next();
});

module.exports = mongoose.model('Order', orderSchema);
