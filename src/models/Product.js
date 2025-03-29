const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    _idCategory: {
      type: mongoose.Schema.Types.String,
      ref: 'Category',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
  },
  { timestamps: true },
);

module.exports = mongoose.model('Product', ProductSchema);
