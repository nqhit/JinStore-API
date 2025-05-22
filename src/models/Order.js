const mongoose = require('mongoose');

// Schema cho từng sản phẩm trong đơn hàng
const orderItemSchema = new mongoose.Schema(
  {
    //COMMENT: Tên sản phẩm tại thời điểm mua
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    //COMMENT: Giá tại thời điểm mua
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    _idProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
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

    paymentMethod: {
      type: String,
      enum: ['vnpay', 'cod'],
      required: true,
    },

    totalAmount: {
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
      default: null,
    },

    status: {
      type: String,
      required: true,
      enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'],
      default: 'pending',
    },

    note: {
      type: String,
    },
  },
  {
    timestamps: true, // createdAt và updatedAt tự động
  },
);
module.exports = mongoose.model('Order', orderSchema);
