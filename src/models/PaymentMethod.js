const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['COD', 'BANKING', 'E_WALLET'],
    },
    provider: {
      type: String,
      required: function () {
        return this.type !== 'COD';
      },
      enum: ['VNPay', 'Momo', 'ZaloPay', null],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);
