const mongoose = require('mongoose');

const orderItemsSchema = new mongoose.Schema({
  _idProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  _idOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
});
module.exports = mongoose.model('Product', orderItemsSchema);
