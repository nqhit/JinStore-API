const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  discount: { type: Number, required: true },
  expiration: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
  quantityLimit: { type: Number, default: 100 },
  quantityUsed: { type: Number, default: 0 },
});

module.exports = mongoose.model('Discount', DiscountSchema);
