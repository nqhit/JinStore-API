const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    _idProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false }, // Avoid creating _id for each item
);

const cartSchema = new mongoose.Schema(
  {
    _idUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Each user has only one cart
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// Create an index for faster cart lookup by user
cartSchema.index({ _idUser: 1 });

module.exports = mongoose.model('Cart', cartSchema);
