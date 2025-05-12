const mongoose = require('mongoose');

// Schema cho giao dịch thanh toán
const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Thay thế phương thức thanh toán cũ bằng tham chiếu đến PaymentMethod
    paymentMethod: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      required: true,
    },

    transactionId: {
      type: String,
      required: function () {
        // Chỉ yêu cầu transactionId khi không phải COD
        // Sẽ cần populate paymentMethod để kiểm tra
        return false; // Sẽ được kiểm tra ở middleware
      },
    },

    amount: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },

    paymentTime: {
      type: Date,
    },

    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

// Middleware để kiểm tra transactionId dựa trên paymentMethod
paymentSchema.pre('validate', async function (next) {
  try {
    if (!this.paymentMethod) return next();

    // Populate paymentMethod để lấy thông tin type
    await this.populate('paymentMethod', 'type');

    // Nếu không phải COD và không có transactionId
    if (this.paymentMethod.type !== 'COD' && this.status === 'paid' && !this.transactionId) {
      this.invalidate('transactionId', 'TransactionID is required for non-COD payments');
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
