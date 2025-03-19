const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    image: { type: String },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Category', categorySchema);
